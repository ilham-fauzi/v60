package models

import "time"

type BrewSession struct {
	ID              string     `json:"id"`
	UserID          string     `json:"userId"`
	RecipeID        string     `json:"recipeId,omitempty"`
	StartedAt       time.Time  `json:"startedAt"`
	CompletedAt     *time.Time `json:"completedAt,omitempty"`
	FinalWeight     float64    `json:"finalWeight"`
	HistoryJSON     string     `json:"historyJson,omitempty"` // Store as string for easy serialization
	SensoryFeedback string     `json:"sensoryFeedback,omitempty"`
}
