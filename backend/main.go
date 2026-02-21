package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/fasthttp/router"
	"github.com/gorilla/websocket"
	"github.com/valyala/fasthttp"
)

var (
	gatewayURL   = getEnv("OPENCLAW_GATEWAY_URL", "ws://127.0.0.1:18789")
	gatewayToken = ""
	upgrader     = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool { return true },
	}
)

func main() {
	// Load gateway token from config
	loadGatewayToken()

	r := router.New()
	
	// Health check
	r.GET("/api/health", healthHandler)
	
	// Gateway proxy endpoints
	r.GET("/api/sessions", sessionsHandler)
	r.GET("/api/cron", cronHandler)
	r.GET("/api/channels", channelsHandler)
	r.GET("/api/memory", memoryHandler)
	
	// Browser proxy
	r.GET("/api/browser/status", browserStatusHandler)
	r.GET("/api/browser/tabs", browserTabsHandler)
	r.POST("/api/browser/screenshot", browserScreenshotHandler)
	
	// GitHub proxy
	r.GET("/api/github/repos", githubReposHandler)
	
	// WebSocket for live updates
	r.GET("/ws", websocketHandler)
	
	// Static files
	fs := &fasthttp.FS{
		Root:       "../frontend/dist",
		IndexNames: []string{"index.html"},
	}
	r.NotFound = fs.NewRequestHandler()

	log.Println("Rarclaw Control Center starting on :3333")
	log.Fatal(fasthttp.ListenAndServe(":3333", r.Handler))
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func loadGatewayToken() {
	// Try to load from ~/.openclaw/openclaw.json
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		log.Printf("Warning: could not load openclaw.json: %v", err)
		return
	}
	
	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		log.Printf("Warning: could not parse openclaw.json: %v", err)
		return
	}
	
	// Extract token from gateway.auth.token
	if gateway, ok := config["gateway"].(map[string]interface{}); ok {
		if auth, ok := gateway["auth"].(map[string]interface{}); ok {
			if token, ok := auth["token"].(string); ok {
				gatewayToken = token
				log.Println("Loaded gateway token from config")
			}
		}
	}
}

func healthHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"status": "ok",
		"gateway": gatewayURL,
	})
}