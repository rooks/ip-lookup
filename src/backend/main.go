package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/hashicorp/golang-lru/v2/expirable"
	"ip-lookup/handlers"
	"ip-lookup/models"
	"ip-lookup/services"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	cache := expirable.NewLRU[string, *models.LookupResponse](10000, nil, time.Hour)
	geoService := services.NewGeoService(cache)

	lookupHandler := handlers.NewLookupHandler(geoService)

	mux := http.NewServeMux()

	// routes

	mux.HandleFunc("/api/lookup/", lookupHandler.HandleLookup)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	// Serve static files from frontend dist
	// In production (Docker), files are at ./frontend/dist
	// In development, files are at ../frontend/dist
	staticDir := "./frontend/dist"
	if _, err := os.Stat(staticDir); os.IsNotExist(err) {
		staticDir = "../frontend/dist"
	}
	fs := http.FileServer(http.Dir(staticDir))
	mux.Handle("/", fs)

	handler := corsMiddleware(mux)

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf(":%s", port), handler); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}

func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Allow requests from any origin during development
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		// Handle preflight requests
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	})
}
