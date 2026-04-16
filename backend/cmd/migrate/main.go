package main

import (
	"context"
	"database/sql"
	"flag"
	"fmt"
	"log"
	"time"

	"github.com/ilham-fauzi/brewforce-backend/internal/auth"
	"github.com/ilham-fauzi/brewforce-backend/internal/db"
	"github.com/ilham-fauzi/brewforce-backend/internal/models"
	_ "modernc.org/sqlite"
)

func main() {
	targetUserID := flag.String("userId", "system-migration", "The Supabase User ID to assign to migrated recipes")
	sqlitePath := flag.String("sqlite", "../prisma/dev.db", "Path to the SQLite database file")
	flag.Parse()

	log.Printf("Starting data migration from %s to Oracle...", *sqlitePath)
	log.Printf("Target User ID: %s", *targetUserID)

	// Load Config
	cfg := auth.LoadConfig()

	// Connect to SQLite
	sqliteDB, err := sql.Open("sqlite", *sqlitePath)
	if err != nil {
		log.Fatalf("Failed to open SQLite: %v", err)
	}
	defer sqliteDB.Close()

	// Connect to Oracle
	oracle, err := db.NewOracleDB(cfg.OracleUser, cfg.OraclePassword, cfg.OracleConnectString, "./wallet", cfg.OracleLibDir)
	if err != nil {
		log.Fatalf("Failed to connect to Oracle: %v", err)
	}
	defer oracle.Close()

	// Ensure Schema
	if err := oracle.InitSchema("schema.sql"); err != nil {
		log.Printf("Warning: Schema initialization failed: %v", err)
	}

	ctx := context.Background()

	// 1. Migrate Recipes
	log.Println("Migrating Recipes...")
	recipeRows, err := sqliteDB.Query(`SELECT id, name, method, coffeeGrams, waterGrams, ratio, grindSize, temperature, beanOrigin, aiGenerated, notes, createdAt, updatedAt, iceGrams FROM Recipe`)
	if err != nil {
		log.Fatalf("Failed to query recipes: %v", err)
	}
	defer recipeRows.Close()

	recipeCount := 0
	for recipeRows.Next() {
		var r models.Recipe
		var aiGenerated int
		var createdAt, updatedAt string
		var beanOrigin, notes sql.NullString
		err := recipeRows.Scan(
			&r.ID, &r.Name, &r.Method, &r.CoffeeGrams, &r.WaterGrams, &r.Ratio, &r.GrindSize,
			&r.Temperature, &beanOrigin, &aiGenerated, &notes, &createdAt, &updatedAt, &r.IceGrams,
		)
		if err != nil {
			log.Printf("Error scanning recipe: %v", err)
			continue
		}
		r.UserID = *targetUserID
		r.AIGenerated = aiGenerated == 1
		r.BeanOrigin = beanOrigin.String
		r.Notes = notes.String
		r.CreatedAt, _ = time.Parse(time.RFC3339, createdAt)
		r.UpdatedAt, _ = time.Parse(time.RFC3339, updatedAt)

		if err := oracle.CreateRecipe(ctx, r); err != nil {
			log.Printf("Failed to insert recipe %s: %v", r.ID, err)
		} else {
			recipeCount++
		}
	}
	log.Printf("Successfully migrated %d recipes", recipeCount)

	// 2. Migrate BrewStages
	log.Println("Migrating BrewStages...")
	stageRows, err := sqliteDB.Query(`SELECT id, recipeId, name, targetWeight, targetSeconds, temperature, action, notes FROM BrewStage`)
	if err != nil {
		log.Fatalf("Failed to query stages: %v", err)
	}
	defer stageRows.Close()

	stageCount := 0
	for stageRows.Next() {
		var s models.Stage
		var notes sql.NullString
		err := stageRows.Scan(&s.ID, &s.RecipeID, &s.Name, &s.TargetWeight, &s.TargetSeconds, &s.Temperature, &s.Action, &notes)
		if err != nil {
			log.Printf("Error scanning stage: %v", err)
			continue
		}
		s.Notes = notes.String
		if err := oracle.AddBrewStages(ctx, s.RecipeID, []models.Stage{s}); err != nil {
			log.Printf("Failed to insert stage %s: %v", s.ID, err)
		} else {
			stageCount++
		}
	}
	log.Printf("Successfully migrated %d stages", stageCount)

	// 3. Migrate BrewSessions
	log.Println("Migrating BrewSessions...")
	sessionRows, err := sqliteDB.Query(`SELECT id, recipeId, startedAt, completedAt, finalWeight, historyJson, sensoryFeedback FROM BrewSession`)
	if err != nil {
		log.Fatalf("Failed to query sessions: %v", err)
	}
	defer sessionRows.Close()

	sessionCount := 0
	for sessionRows.Next() {
		var s models.BrewSession
		var startedAt, completedAt *string
		var recipeID, historyJSON, sensoryFeedback sql.NullString
		err := sessionRows.Scan(&s.ID, &recipeID, &startedAt, &completedAt, &s.FinalWeight, &historyJSON, &sensoryFeedback)
		if err != nil {
			log.Printf("Error scanning session: %v", err)
			continue
		}
		s.UserID = *targetUserID
		s.RecipeID = recipeID.String
		s.HistoryJSON = historyJSON.String
		s.SensoryFeedback = sensoryFeedback.String
		if startedAt != nil {
			s.StartedAt, _ = time.Parse(time.RFC3339, *startedAt)
		}
		if completedAt != nil {
			t, _ := time.Parse(time.RFC3339, *completedAt)
			s.CompletedAt = &t
		}

		if err := oracle.SaveBrewSession(ctx, s); err != nil {
			log.Printf("Failed to insert session %s: %v", s.ID, err)
		} else {
			sessionCount++
		}
	}
	log.Printf("Successfully migrated %d sessions", sessionCount)

	fmt.Println("\nMigration Completed Successfully!")
}
