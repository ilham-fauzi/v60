package models

import "time"

type Recipe struct {
	ID          string    `json:"id"`
	UserID      string    `json:"userId"`
	Name        string    `json:"name"`
	Method      string    `json:"method"`
	CoffeeGrams float64   `json:"coffeeGrams"`
	WaterGrams  float64   `json:"waterGrams"`
	IceGrams    float64   `json:"iceGrams"`
	Ratio       float64   `json:"ratio"`
	GrindSize   string    `json:"grindSize"`
	Temperature float64   `json:"temperature"`
	BeanOrigin  string    `json:"beanOrigin,omitempty"`
	AIGenerated bool      `json:"aiGenerated"`
	Notes       string    `json:"notes,omitempty"`
	Rating      float64   `json:"rating"`
	RatingCount int       `json:"ratingCount"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
	Stages      []Stage   `json:"stages,omitempty"`
}

type Stage struct {
	ID            string  `json:"id"`
	RecipeID      string  `json:"recipeId"`
	Name          string  `json:"name"`
	TargetWeight  float64 `json:"targetWeight"`
	TargetSeconds int     `json:"targetSeconds"`
	Temperature   float64 `json:"temperature"`
	Action        string  `json:"action"`
	Notes         string  `json:"notes,omitempty"`
}
