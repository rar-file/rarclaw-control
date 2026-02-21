package main

import (
	"encoding/json"
	"io"
	"net/http"

	"github.com/valyala/fasthttp"
)

func browserStatusHandler(ctx *fasthttp.RequestCtx) {
	// Proxy to browser control service
	req, _ := http.NewRequest("GET", "http://127.0.0.1:18791/", nil)
	req.Header.Set("Authorization", "Bearer "+gatewayToken)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.Error(`{"error": "browser not running", "details": "`+err.Error()+`"}`, 503)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}

func browserTabsHandler(ctx *fasthttp.RequestCtx) {
	req, _ := http.NewRequest("GET", "http://127.0.0.1:18791/tabs", nil)
	req.Header.Set("Authorization", "Bearer "+gatewayToken)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.Error(`{"error": "browser not running"}`, 503)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}

func browserScreenshotHandler(ctx *fasthttp.RequestCtx) {
	// Forward screenshot request
	targetID := string(ctx.QueryArgs().Peek("targetId"))
	url := "http://127.0.0.1:18791/screenshot"
	if targetID != "" {
		url += "?targetId=" + targetID
	}
	
	req, _ := http.NewRequest("POST", url, nil)
	req.Header.Set("Authorization", "Bearer "+gatewayToken)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.Error(`{"error": "screenshot failed"}`, 500)
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}