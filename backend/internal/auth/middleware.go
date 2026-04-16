package auth

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"math/big"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/golang-jwt/jwt/v5"
)

// jwksCache caches the public key to avoid fetching on every request
type jwksCache struct {
	mu        sync.RWMutex
	key       *ecdsa.PublicKey
	fetchedAt time.Time
}

var cache = &jwksCache{}

// fetchPublicKey retrieves and parses the ES256 public key from Supabase's JWKS endpoint
func fetchPublicKey(supabaseURL string) (*ecdsa.PublicKey, error) {
	url := supabaseURL + "/auth/v1/.well-known/jwks.json"
	resp, err := http.Get(url)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch JWKS: %w", err)
	}
	defer resp.Body.Close()

	var jwks struct {
		Keys []struct {
			Kty string `json:"kty"`
			Crv string `json:"crv"`
			X   string `json:"x"`
			Y   string `json:"y"`
		} `json:"keys"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&jwks); err != nil {
		return nil, fmt.Errorf("failed to decode JWKS: %w", err)
	}
	if len(jwks.Keys) == 0 {
		return nil, fmt.Errorf("no keys found in JWKS response")
	}

	key := jwks.Keys[0]
	xBytes, err := base64.RawURLEncoding.DecodeString(key.X)
	if err != nil {
		return nil, fmt.Errorf("failed to decode key X: %w", err)
	}
	yBytes, err := base64.RawURLEncoding.DecodeString(key.Y)
	if err != nil {
		return nil, fmt.Errorf("failed to decode key Y: %w", err)
	}

	pub := &ecdsa.PublicKey{
		Curve: elliptic.P256(),
		X:     new(big.Int).SetBytes(xBytes),
		Y:     new(big.Int).SetBytes(yBytes),
	}
	return pub, nil
}

// getPublicKey returns a cached public key, refreshing every 12 hours
func getPublicKey(supabaseURL string) (*ecdsa.PublicKey, error) {
	cache.mu.RLock()
	if cache.key != nil && time.Since(cache.fetchedAt) < 12*time.Hour {
		key := cache.key
		cache.mu.RUnlock()
		return key, nil
	}
	cache.mu.RUnlock()

	cache.mu.Lock()
	defer cache.mu.Unlock()
	// Double-check under write lock to prevent stampede
	if cache.key != nil && time.Since(cache.fetchedAt) < 12*time.Hour {
		return cache.key, nil
	}
	key, err := fetchPublicKey(supabaseURL)
	if err != nil {
		return nil, err
	}
	cache.key = key
	cache.fetchedAt = time.Now()
	log.Printf("[AUTH] JWKS public key refreshed from %s", supabaseURL)
	return key, nil
}

// JWTMiddleware validates Supabase JWTs using ES256 asymmetric verification via JWKS
func JWTMiddleware(supabaseURL string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		authHeader := c.Get("Authorization")
		if authHeader == "" {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Missing authorization header",
			})
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token format",
			})
		}

		pubKey, err := getPublicKey(supabaseURL)
		if err != nil {
			log.Printf("[AUTH] Failed to fetch JWKS public key: %v", err)
			return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{
				"error": "Authentication service unavailable",
			})
		}

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return pubKey, nil
		})

		if err != nil {
			log.Printf("[AUTH] Token validation failed: %v", err)
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": fmt.Sprintf("Invalid or expired token: %v", err),
			})
		}

		if !token.Valid {
			log.Println("[AUTH] Token is invalid")
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"error": "Invalid token claims",
			})
		}

		// Set user identity to context
		c.Locals("userId", claims["sub"])

		return c.Next()
	}
}
