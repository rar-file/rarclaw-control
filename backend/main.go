package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

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
	loadGatewayToken()
	loadGitHubToken()

	r := router.New()
	
	// Health check
	r.GET("/api/health", healthHandler)
	
	// Sessions
	r.GET("/api/sessions", sessionsHandler)
	
	// Cron
	r.GET("/api/cron", cronListHandler)
	r.POST("/api/cron", cronCreateHandler)
	r.POST("/api/cron/{id}/run", cronRunHandler)
	r.DELETE("/api/cron/{id}", cronDeleteHandler)
	
	// Channels
	r.GET("/api/channels", channelsHandler)
	
	// Memory
	r.GET("/api/memory", memoryListHandler)
	r.GET("/api/memory/{filename}", memoryFileHandler)
	
	// Browser
	r.GET("/api/browser/status", browserStatusHandler)
	r.GET("/api/browser/tabs", browserTabsHandler)
	r.POST("/api/browser/screenshot", browserScreenshotHandler)
	
	// GitHub
	r.GET("/api/github/repos", githubReposHandler)
	
	// WebSocket
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
		return
	}
	
	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
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
	if token := os.Getenv("GITHUB_TOKEN"); token != "" {
		githubToken = strings.TrimSpace(token)
		return
	}
	
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

// Sessions Handler - calls openclaw CLI
func sessionsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	cmd := exec.Command("openclaw", "sessions", "list", "--json")
	output, err := cmd.Output()
	if err != nil {
		// Fallback: return empty sessions
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"sessions": []interface{}{},
		})
		return
	}
	
	ctx.Write(output)
}

// Cron Handlers
func cronListHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	cmd := exec.Command("openclaw", "cron", "list", "--json")
	output, err := cmd.Output()
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"jobs": []interface{}{},
		})
		return
	}
	
	ctx.Write(output)
}

func cronCreateHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	var req struct {
		Name     string `json:"name"`
		Schedule string `json:"schedule"`
		Command  string `json:"command"`
	}
	
	if err := json.Unmarshal(ctx.PostBody(), &req); err != nil {
		ctx.SetStatusCode(400)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "invalid request"})
		return
	}
	
	cmd := exec.Command("openclaw", "cron", "add", "--name", req.Name, "--schedule", req.Schedule, req.Command)
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		ctx.SetStatusCode(500)
		json.NewEncoder(ctx).Encode(map[string]string{"error": string(output)})
		return
	}
	
	json.NewEncoder(ctx).Encode(map[string]string{"status": "created"})
}

func cronRunHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	jobID := ctx.UserValue("id").(string)
	
	cmd := exec.Command("openclaw", "cron", "run", jobID)
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		ctx.SetStatusCode(500)
		json.NewEncoder(ctx).Encode(map[string]string{"error": string(output)})
		return
	}
	
	json.NewEncoder(ctx).Encode(map[string]string{"status": "triggered"})
}

func cronDeleteHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	jobID := ctx.UserValue("id").(string)
	
	cmd := exec.Command("openclaw", "cron", "remove", jobID)
	output, err := cmd.CombinedOutput()
	
	if err != nil {
		ctx.SetStatusCode(500)
		json.NewEncoder(ctx).Encode(map[string]string{"error": string(output)})
		return
	}
	
	json.NewEncoder(ctx).Encode(map[string]string{"status": "deleted"})
}

// Channels Handler
func channelsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	// Try to get from gateway config
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"channels": []interface{}{},
		})
		return
	}
	
	var config map[string]interface{}
	json.Unmarshal(data, &config)
	
	channels := []map[string]string{}
	if chans, ok := config["channels"].(map[string]interface{}); ok {
		for name := range chans {
			channels = append(channels, map[string]string{
				"name":   name,
				"status": "connected",
			})
		}
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"channels": channels})
}

// Memory Handlers
func memoryListHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	workspace := getEnv("OPENCLAW_WORKSPACE", filepath.Join(os.Getenv("HOME"), ".openclaw", "workspace"))
	memoryDir := filepath.Join(workspace, "memory")
	
	files, err := os.ReadDir(memoryDir)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"files": []interface{}{},
		})
		return
	}
	
	var fileList []map[string]interface{}
	for _, f := range files {
		if !f.IsDir() && strings.HasSuffix(f.Name(), ".md") {
			info, _ := f.Info()
			fileList = append(fileList, map[string]interface{}{
				"name": f.Name(),
				"size": info.Size(),
				"modified": info.ModTime().Format(time.RFC3339),
			})
		}
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"files": fileList})
}

func memoryFileHandler(ctx *fasthttp.RequestCtx) {
	filename := ctx.UserValue("filename").(string)
	
	// Security: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") {
		ctx.SetStatusCode(403)
		return
	}
	
	workspace := getEnv("OPENCLAW_WORKSPACE", filepath.Join(os.Getenv("HOME"), ".openclaw", "workspace"))
	memoryDir := filepath.Join(workspace, "memory")
	filepath := filepath.Join(memoryDir, filename)
	
	data, err := os.ReadFile(filepath)
	if err != nil {
		ctx.SetStatusCode(404)
		json.NewEncoder(ctx).Encode(map[string]string{"error": "file not found"})
		return
	}
	
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"name":    filename,
		"content": string(data),
	})
}

// Browser Handlers
func browserStatusHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	// Check if browser is available via gateway
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"status":  "available",
		"version": "chrome",
	})
}

func browserTabsHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]interface{}{
		"tabs": []interface{}{},
	})
}

func browserScreenshotHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(map[string]string{
		"status": "not implemented",
	})
}

// GitHub Handler
func githubReposHandler(ctx *fasthttp.RequestCtx) {
	ctx.SetContentType("application/json")
	
	if githubToken == "" {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"repos": []interface{}{},
			"error": "no token",
		})
		return
	}
	
	req, _ := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=10", nil)
	req.Header.Set("Authorization", "Bearer "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		json.NewEncoder(ctx).Encode(map[string]interface{}{
			"repos": []interface{}{},
			"error": err.Error(),
		})
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	
	// Parse and simplify
	var repos []map[string]interface{}
	json.Unmarshal(body, &repos)
	
	var simplified []map[string]interface{}
	for _, r := range repos {
		simplified = append(simplified, map[string]interface{}{
			"name":        r["name"],
			"full_name":   r["full_name"],
			"description": r["description"],
			"stars":       r["stargazers_count"],
			"forks":       r["forks_count"],
			"updated":     r["updated_at"],
			"url":         r["html_url"],
		})
	}
	
	json.NewEncoder(ctx).Encode(map[string]interface{}{"repos": simplified})
}

// WebSocket Handler
func websocketHandler(ctx *fasthttp.RequestCtx) {
	// Upgrade to WebSocket
	ctx.Error("WebSocket not implemented", fasthttp.StatusNotImplemented)
}
