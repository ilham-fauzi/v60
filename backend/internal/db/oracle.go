package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/ilham-fauzi/brewforce-backend/internal/models"
	_ "github.com/godror/godror"
)

type OracleDB struct {
	Conn *sql.DB
}

func NewOracleDB(user, password, connectString string, walletPath string, libDir string) (*OracleDB, error) {
	// For godror, we can pass connection parameters in a map or a string.
	// We'll use the walletPath to set the TNS_ADMIN effectively.
	
	// Option to set Oracle Instant Client library directory
	// In some godror versions, this is handled via dsn parameter or environment variables.
	
	// Create common DSN
	// If walletPath is provided, we use it for security
	dsn := fmt.Sprintf(`user="%s" password="%s" connectString="%s"`, user, password, connectString)
	
	if libDir != "" {
		dsn = fmt.Sprintf("%s libDir=%q", dsn, libDir)
	}
	// For godror, you can also set environment variables like TNS_ADMIN 
	// before calling sql.Open.
	// Use absolute path for TNS_ADMIN to ensure stability
	absWalletPath, err := filepath.Abs(walletPath)
	if err == nil {
		os.Setenv("TNS_ADMIN", absWalletPath)
	} else {
		os.Setenv("TNS_ADMIN", walletPath)
	}

	db, err := sql.Open("godror", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open oracle connection: %w", err)
	}

	// Configure pool
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(time.Hour)

	// Check connection
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping oracle database: %w", err)
	}

	log.Println("Successfully connected to Oracle Autonomous AI Database")
	return &OracleDB{Conn: db}, nil
}

func (o *OracleDB) InitSchema(schemaPath string) error {
	content, err := os.ReadFile(schemaPath)
	if err != nil {
		return fmt.Errorf("failed to read schema file: %w", err)
	}

	// Simple execution - split by semicolon for multi-statement execution
	statements := strings.Split(string(content), ";")
	for _, stmt := range statements {
		stmt = strings.TrimSpace(stmt)
		if stmt == "" {
			continue
		}
		_, err = o.Conn.Exec(stmt)
		if err != nil {
			// Log but continue (tables might exist)
			log.Printf("Note: Statement execution skipped or failed: %v", err)
		}
	}
	log.Println("Schema initialization check complete")
	return nil
}

// RECIPE METHODS

func (o *OracleDB) GetRecipes(ctx context.Context, userID string) ([]models.Recipe, error) {
	query := `SELECT id, name, method, coffee_grams, water_grams, ice_grams, ratio, 
	          grind_size, temperature, bean_origin, ai_generated, notes, 
	          rating, rating_count, created_at, updated_at 
	          FROM RECIPES WHERE user_id = :1`
	
	rows, err := o.Conn.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var recipes []models.Recipe
	for rows.Next() {
		var r models.Recipe
		var aiGenerated int
		err := rows.Scan(
			&r.ID, &r.Name, &r.Method, &r.CoffeeGrams, &r.WaterGrams, &r.IceGrams, &r.Ratio,
			&r.GrindSize, &r.Temperature, &r.BeanOrigin, &aiGenerated, &r.Notes,
			&r.Rating, &r.RatingCount, &r.CreatedAt, &r.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		r.AIGenerated = aiGenerated == 1
		recipes = append(recipes, r)
	}
	return recipes, nil
}

func (o *OracleDB) CreateRecipe(ctx context.Context, r models.Recipe) error {
	query := `INSERT INTO RECIPES (id, user_id, name, method, coffee_grams, water_grams, ice_grams, 
	          ratio, grind_size, temperature, bean_origin, ai_generated, notes, rating, rating_count) 
	          VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12, :13, :14, :15)`
	
	aiGenerated := 0
	if r.AIGenerated {
		aiGenerated = 1
	}

	_, err := o.Conn.ExecContext(ctx, query,
		r.ID, r.UserID, r.Name, r.Method, r.CoffeeGrams, r.WaterGrams, r.IceGrams,
		r.Ratio, r.GrindSize, r.Temperature, r.BeanOrigin, aiGenerated, r.Notes, r.Rating, r.RatingCount,
	)
	return err
}

func (o *OracleDB) AddBrewStages(ctx context.Context, recipeID string, stages []models.Stage) error {
	query := `INSERT INTO BREW_STAGES (id, recipe_id, name, target_weight, target_seconds, temperature, action, notes) 
	          VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`
	
	for _, s := range stages {
		_, err := o.Conn.ExecContext(ctx, query,
			s.ID, recipeID, s.Name, s.TargetWeight, s.TargetSeconds, s.Temperature, s.Action, s.Notes,
		)
		if err != nil {
			return err
		}
	}
	return nil
}

func (o *OracleDB) GetStagesByRecipeID(ctx context.Context, recipeID string) ([]models.Stage, error) {
	query := `SELECT id, name, target_weight, target_seconds, temperature, action, notes 
	          FROM BREW_STAGES WHERE recipe_id = :1 ORDER BY id` // Oracle might need a specific sort if ID isn't sequence
	
	rows, err := o.Conn.QueryContext(ctx, query, recipeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var stages []models.Stage
	for rows.Next() {
		var s models.Stage
		s.RecipeID = recipeID
		err := rows.Scan(&s.ID, &s.Name, &s.TargetWeight, &s.TargetSeconds, &s.Temperature, &s.Action, &s.Notes)
		if err != nil {
			return nil, err
		}
		stages = append(stages, s)
	}
	return stages, nil
}

// SESSION METHODS

func (o *OracleDB) SaveBrewSession(ctx context.Context, s models.BrewSession) error {
	query := `INSERT INTO BREW_SESSIONS (id, user_id, recipe_id, started_at, completed_at, final_weight, history_json, sensory_feedback) 
	          VALUES (:1, :2, :3, :4, :5, :6, :7, :8)`

	// Oracle treats empty string differently from NULL.
	// An empty RecipeID must be stored as NULL so the FK constraint is not violated.
	var recipeID sql.NullString
	if s.RecipeID != "" {
		recipeID = sql.NullString{String: s.RecipeID, Valid: true}
	}

	_, err := o.Conn.ExecContext(ctx, query,
		s.ID, s.UserID, recipeID, s.StartedAt, s.CompletedAt, s.FinalWeight, s.HistoryJSON, s.SensoryFeedback,
	)
	return err
}


func (o *OracleDB) GetBrewSessions(ctx context.Context, userID string) ([]models.BrewSession, error) {
	query := `SELECT id, recipe_id, started_at, completed_at, final_weight, history_json, sensory_feedback 
	          FROM BREW_SESSIONS WHERE user_id = :1 ORDER BY started_at DESC`
	
	rows, err := o.Conn.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sessions []models.BrewSession
	for rows.Next() {
		var s models.BrewSession
		s.UserID = userID
		var recipeID sql.NullString
		var completedAt sql.NullTime
		var historyJSON sql.NullString
		var sensoryFeedback sql.NullString

		err := rows.Scan(&s.ID, &recipeID, &s.StartedAt, &completedAt, &s.FinalWeight, &historyJSON, &sensoryFeedback)
		if err != nil {
			return nil, err
		}
		
		if recipeID.Valid {
			s.RecipeID = recipeID.String
		}
		if completedAt.Valid {
			s.CompletedAt = &completedAt.Time
		}
		if historyJSON.Valid {
			s.HistoryJSON = historyJSON.String
		}
		if sensoryFeedback.Valid {
			s.SensoryFeedback = sensoryFeedback.String
		}
		
		sessions = append(sessions, s)
	}
	return sessions, nil
}

func (o *OracleDB) DeleteRecipe(ctx context.Context, userID, recipeID string) error {
	query := `DELETE FROM RECIPES WHERE id = :1 AND user_id = :2`
	_, err := o.Conn.ExecContext(ctx, query, recipeID, userID)
	return err
}

func (o *OracleDB) UpdateRecipe(ctx context.Context, r models.Recipe) error {
	query := `UPDATE RECIPES SET 
	          name = :1, method = :2, coffee_grams = :3, water_grams = :4, ice_grams = :5, 
	          ratio = :6, grind_size = :7, temperature = :8, bean_origin = :9, 
	          ai_generated = :10, notes = :11, rating = :12, rating_count = :13, 
	          updated_at = CURRENT_TIMESTAMP
	          WHERE id = :14 AND user_id = :15`
	
	aiGenerated := 0
	if r.AIGenerated {
		aiGenerated = 1
	}

	_, err := o.Conn.ExecContext(ctx, query,
		r.Name, r.Method, r.CoffeeGrams, r.WaterGrams, r.IceGrams,
		r.Ratio, r.GrindSize, r.Temperature, r.BeanOrigin, aiGenerated, r.Notes,
		r.Rating, r.RatingCount, r.ID, r.UserID,
	)
	return err
}

func (o *OracleDB) GetMetrics(ctx context.Context, userID string) (map[string]interface{}, error) {
	metrics := make(map[string]interface{})

	// 1. Total Recipes
	var totalRecipes int
	err := o.Conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM RECIPES WHERE user_id = :1", userID).Scan(&totalRecipes)
	if err == nil { metrics["totalRecipes"] = totalRecipes }

	// 2. Total Brews
	var totalBrews int
	err = o.Conn.QueryRowContext(ctx, "SELECT COUNT(*) FROM BREW_SESSIONS WHERE user_id = :1", userID).Scan(&totalBrews)
	if err == nil { metrics["totalBrews"] = totalBrews }

	// 3. Favorite Origin
	var favoriteOrigin string
	err = o.Conn.QueryRowContext(ctx, `
		SELECT bean_origin FROM (
			SELECT bean_origin, COUNT(*) as cnt 
			FROM RECIPES 
			WHERE user_id = :1 AND bean_origin IS NOT NULL
			GROUP BY bean_origin 
			ORDER BY cnt DESC
		) WHERE ROWNUM = 1`, userID).Scan(&favoriteOrigin)
	if err == nil { metrics["favoriteOrigin"] = favoriteOrigin }

	// 4. Avg Rating
	var avgRating float64
	err = o.Conn.QueryRowContext(ctx, "SELECT AVG(rating) FROM RECIPES WHERE user_id = :1 AND rating > 0", userID).Scan(&avgRating)
	if err == nil { metrics["avgRating"] = avgRating }

	return metrics, nil
}

func (o *OracleDB) Close() {
	if o.Conn != nil {
		o.Conn.Close()
	}
}
