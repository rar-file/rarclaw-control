package main

import (
	"encoding/json"
	"io"
	"net/http"
	"os"

	"github.com/valyala/fasthttp"
)

var githubToken = os.Getenv("GITHUB_TOKEN")

func githubReposHandler(ctx *fasthttp.RequestCtx) {
	if githubToken == "" {
		// Try to load from file
		home, _ := os.UserHomeDir()
		data, err := os.ReadFile(home + "/.openclaw/credentials/github.token")
		if err == nil {
			githubToken = string(data)
		}
	}
	
	if githubToken == "" {
		ctx.Error(`{"error": "GitHub token not configured"}`, 401)
		return
	}
	
	req, _ := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=20", nil)
	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.Error(`{"error": "GitHub API error"}`, 500)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}