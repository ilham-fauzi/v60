package main

import (
	"context"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/ilham-fauzi/brewforce-backend/internal/auth"
	"github.com/ilham-fauzi/brewforce-backend/internal/db"
	"github.com/ilham-fauzi/brewforce-backend/internal/models"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/logger"
)

func main() {
	// Initialize Config from Secrets Manager (populated via SOPS/Age)
	cfg := auth.LoadConfig()

	// Initialize Oracle DB
	oracle, err := db.NewOracleDB(cfg.OracleUser, cfg.OraclePassword, cfg.OracleConnectString, "./wallet", cfg.OracleLibDir)
	if err != nil {
		log.Printf("CRITICAL: Failed to connect to Oracle DB: %v", err)
		// We could fatal here, but let's allow the API to start for health checks
	} else {
		defer oracle.Close()
		// Initialize Schema
		if err := oracle.InitSchema("./schema.sql"); err != nil {
			log.Printf("WARNING: Schema initialization failed: %v", err)
		}
	}

	// Option to set Oracle Instant Client library directory
	// In some godror versions, this is handled via dsn parameter
	// or environment variables.

	app := fiber.New(fiber.Config{
		AppName: "BrewForce API v2.4",
	})

	// Middleware
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		AllowOrigins: "*", // Adjust for production
		AllowHeaders: "Origin, Content-Type, Accept, Authorization",
	}))

	// Public Routes
	app.Get("/health", func(c *fiber.Ctx) error {
		return c.Status(200).JSON(fiber.Map{
			"status":  "ok",
			"service": "BrewForce API",
			"version": "2.4.0",
		})
	})

	// Protected API v1 Group
	v1 := app.Group("/v1")
	
	// Apply JWT Verification to all v1 routes
	if cfg.SupabaseURL != "" {
		v1.Use(auth.JWTMiddleware(cfg.SupabaseURL))
	}


	// Protected Endpoints
	v1.Get("/ping", func(c *fiber.Ctx) error {
		userId := c.Locals("userId")
		return c.Status(200).JSON(fiber.Map{
			"msg":     "Alchemy Vault Backend Active",
			"userId":  userId,
		})
	})

	// Recipe Endpoints
	v1.Get("/recipes", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		recipes, err := oracle.GetRecipes(ctx, userId)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		if recipes == nil {
			recipes = []models.Recipe{}
		}
		return c.JSON(recipes)
	})


	v1.Post("/recipes", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		var recipe models.Recipe
		if err := c.BodyParser(&recipe); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
		}

		recipe.ID = uuid.New().String()
		recipe.UserID = userId
		recipe.CreatedAt = time.Now()
		recipe.UpdatedAt = time.Now()

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := oracle.CreateRecipe(ctx, recipe); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		// Save stages if any
		if len(recipe.Stages) > 0 {
			for i := range recipe.Stages {
				recipe.Stages[i].ID = uuid.New().String()
			}
			if err := oracle.AddBrewStages(ctx, recipe.ID, recipe.Stages); err != nil {
				return c.Status(500).JSON(fiber.Map{"error": "failed to save stages: " + err.Error()})
			}
		}

		return c.Status(201).JSON(recipe)
	})

	v1.Get("/recipes/:id", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		recipeID := c.Params("id")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// For now we use GetRecipes and filter, or we can implement GetRecipeByID
		// Simple implementation to get stages as well
		recipes, err := oracle.GetRecipes(ctx, userId)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}

		var found *models.Recipe
		for _, r := range recipes {
			if r.ID == recipeID {
				found = &r
				break
			}
		}

		if found == nil {
			return c.Status(404).JSON(fiber.Map{"error": "recipe not found"})
		}

		stages, err := oracle.GetStagesByRecipeID(ctx, found.ID)
		if err == nil {
			found.Stages = stages
		}

		return c.JSON(found)
	})

	v1.Put("/recipes/:id", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		recipeID := c.Params("id")
		var recipe models.Recipe
		if err := c.BodyParser(&recipe); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
		}
		recipe.ID = recipeID
		recipe.UserID = userId

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := oracle.UpdateRecipe(ctx, recipe); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(recipe)
	})

	v1.Delete("/recipes/:id", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		recipeID := c.Params("id")
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		if err := oracle.DeleteRecipe(ctx, userId, recipeID); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.SendStatus(204)
	})

	// Session Endpoints
	v1.Get("/sessions", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		sessions, err := oracle.GetBrewSessions(ctx, userId)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		if sessions == nil {
			sessions = []models.BrewSession{}
		}
		return c.JSON(sessions)
	})


	v1.Post("/sessions", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		var session models.BrewSession
		if err := c.BodyParser(&session); err != nil {
			return c.Status(400).JSON(fiber.Map{"error": "invalid request body"})
		}

		session.ID = uuid.New().String()
		session.UserID = userId
		if session.StartedAt.IsZero() {
			session.StartedAt = time.Now()
		}

		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		// Validate recipe_id: if provided but not present in Oracle RECIPES,
		// nullify it to avoid FK_SESSION_RECIPE constraint violation.
		// This happens when the user brews with a local-only recipe that
		// hasn't been synced to the cloud yet.
		if session.RecipeID != "" {
			recipes, lookupErr := oracle.GetRecipes(ctx, userId)
			if lookupErr == nil {
				found := false
				for _, r := range recipes {
					if r.ID == session.RecipeID {
						found = true
						break
					}
				}
				if !found {
					log.Printf("INFO: recipe_id %q not found in Oracle for user %s — saving session without recipe link", session.RecipeID, userId)
					session.RecipeID = ""
				}
			}
		}

		if err := oracle.SaveBrewSession(ctx, session); err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.Status(201).JSON(session)
	})


	// Metrics Endpoint
	v1.Get("/metrics", func(c *fiber.Ctx) error {
		userId := c.Locals("userId").(string)
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()

		metrics, err := oracle.GetMetrics(ctx, userId)
		if err != nil {
			return c.Status(500).JSON(fiber.Map{"error": err.Error()})
		}
		return c.JSON(metrics)
	})

	log.Fatal(app.Listen(":8080"))
}
