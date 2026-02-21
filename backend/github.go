package main

import (
	"io"
	"net/http"

	"github.com/valyala/fasthttp"
)

func githubReposHandler(ctx *fasthttp.RequestCtx) {
	if githubToken == "" {
		ctx.SetContentType("application/json")
		ctx.Write([]byte(`{"error": "GitHub token not configured"}`))
		ctx.SetStatusCode(401)
		return
	}
	
	req, _ := http.NewRequest("GET", "https://api.github.com/user/repos?sort=updated&per_page=20", nil)
	req.Header.Set("Authorization", "token "+githubToken)
	req.Header.Set("Accept", "application/vnd.github.v3+json")
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.SetContentType("application/json")
		ctx.Write([]byte(`{"error": "GitHub API error"}`))
		ctx.SetStatusCode(500)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}