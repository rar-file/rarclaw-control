package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/valyala/fasthttp"
)

func sessionsHandler(ctx *fasthttp.RequestCtx) {
	home, _ := os.UserHomeDir()
	sessionsPath := filepath.Join(home, ".openclaw", "agents", "main", "sessions", "sessions.json")
	
	data, err := os.ReadFile(sessionsPath)
	if err != nil {
		ctx.SetContentType("application/json")
		ctx.Write([]byte(`{"sessions":[]}`))
		return
	}
	
	ctx.SetContentType("application/json")
	ctx.Write(data)
}

func cronHandler(ctx *fasthttp.RequestCtx) {
	home, _ := os.UserHomeDir()
	cronPath := filepath.Join(home, ".openclaw", "cron", "cron.json")
	
	data, err := os.ReadFile(cronPath)
	if err != nil {
		ctx.SetContentType("application/json")
		ctx.Write([]byte("[]"))
		return
	}
	
	ctx.SetContentType("application/json")
	ctx.Write(data)
}

func channelsHandler(ctx *fasthttp.RequestCtx) {
	home, _ := os.UserHomeDir()
	configPath := filepath.Join(home, ".openclaw", "openclaw.json")
	
	data, err := os.ReadFile(configPath)
	if err != nil {
		ctx.Error(`{"error": "config not found"}`, 404)
		return
	}
	
	var config map[string]interface{}
	if err := json.Unmarshal(data, &config); err != nil {
		ctx.Error(`{"error": "invalid config"}`, 500)
		return
	}
	
	channels := map[string]interface{}{}
	if ch, ok := config["channels"].(map[string]interface{}); ok {
		for name, cfg := range ch {
			if chCfg, ok := cfg.(map[string]interface{}); ok {
				enabled := false
				if en, ok := chCfg["enabled"].(bool); ok {
					enabled = en
				}
				channels[name] = map[string]interface{}{
					"enabled": enabled,
				}
			}
		}
	}
	
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(channels)
}

func memoryHandler(ctx *fasthttp.RequestCtx) {
	home, _ := os.UserHomeDir()
	workspace := filepath.Join(home, ".openclaw", "workspace")
	
	entries, err := os.ReadDir(workspace)
	if err != nil {
		ctx.SetContentType("application/json")
		ctx.Write([]byte("[]"))
		return
	}
	
	files := []map[string]string{}
	for _, entry := range entries {
		if !entry.IsDir() {
			info, _ := entry.Info()
			files = append(files, map[string]string{
				"name": entry.Name(),
				"size": formatSize(info.Size()),
			})
		}
	}
	
	// Also check memory/ subdirectory
	memoryDir := filepath.Join(workspace, "memory")
	if memEntries, err := os.ReadDir(memoryDir); err == nil {
		for _, entry := range memEntries {
			if !entry.IsDir() && filepath.Ext(entry.Name()) == ".md" {
				info, _ := entry.Info()
				files = append(files, map[string]string{
					"name": "memory/" + entry.Name(),
					"size": formatSize(info.Size()),
				})
			}
		}
	}
	
	ctx.SetContentType("application/json")
	json.NewEncoder(ctx).Encode(files)
}

func memoryFileHandler(ctx *fasthttp.RequestCtx) {
	filename := ctx.UserValue("filename").(string)
	home, _ := os.UserHomeDir()
	workspace := filepath.Join(home, ".openclaw", "workspace")
	
	// Security: prevent directory traversal
	if filepath.IsAbs(filename) || filepath.HasPrefix(filename, "..") {
		ctx.Error("Invalid filename", 400)
		return
	}
	
	filePath := filepath.Join(workspace, filename)
	data, err := os.ReadFile(filePath)
	if err != nil {
		ctx.Error("File not found", 404)
		return
	}
	
	ctx.SetContentType("text/plain")
	ctx.Write(data)
}

func formatSize(size int64) string {
	if size < 1024 {
		return fmt.Sprintf("%d B", size)
	}
	if size < 1024*1024 {
		return fmt.Sprintf("%.1f KB", float64(size)/1024)
	}
	return fmt.Sprintf("%.1f MB", float64(size)/(1024*1024))
}