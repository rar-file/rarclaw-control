package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	githubToken = ""
)

func main() {
	// Load gateway token from config
	loadGatewayToken()
	loadGitHubToken()

	r := router.New()
	
	// Health check
	r.GET("/api/health", healthHandler)
	
	// Gateway proxy endpoints
	r.GET("/api/sessions", sessionsHandler)
	r.GET("/api/cron", cronHandler)
	r.GET("/api/channels", channelsHandler)
	r.GET("/api/memory", memoryHandler)
	r.GET("/api/memory/{filename}", memoryFileHandler)
	
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

	fmt.Println("Rarclaw Control Center starting on :3333")
	fmt.Println("Gateway:", gatewayURL)
	fmt.Println("Token loaded:", gatewayToken != "")
	fmt.Println("GitHub token loaded:", githubToken != "")
	
	if err := fasthttp.ListenAndServe(":3333", r.Handler); err != nil {
		log.Fatal(err)
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func loadGatewayToken() {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		fmt.Printf("Warning: could not load openclaw.json: %v\n", err)
		return
	}
	
	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		fmt.Printf("Warning: could not parse openclaw.json: %v\n", err)
		return
	}
	
	if gateway, ok := config["gateway"].(map[string]interface{}); ok {
		if auth, ok := gateway["auth"].(map[string]interface{}); ok {
			if token, ok := auth["token"].(string); ok {
				gatewayToken = token
			}
		}
	}
}

func loadGitHubToken() {
	// Try env first
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		githubToken = strings.TrimSpace(token)
		return
	}
	
	// Try file
	home, _ := os.UserHomeDir()
	data, err := os.ReadFile(filepath.Join(home, ".openclaw", "credentials", "github.token"))
	if err == nil {
		githubToken = strings.TrimSpace(string(data))
	}
}

func healthHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"status":  "ok",
		"gateway": gatewayURL,
	})
}