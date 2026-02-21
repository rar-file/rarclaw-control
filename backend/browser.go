package main

import (
	"io"
	"net/http"

	"github.com/valyala/fasthttp"
)

func browserStatusHandler(ctx *fasthttp.RequestCtx) {
	req, _ := http.NewRequest("GET", "http://127.0.0.1:18791/", nil)
	req.Header.Set("Authorization", "Bearer "+gatewayToken)
	
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		ctx.SetContentType("application/json")
		ctx.Write([]byte(`{"running": false, "error": "browser not running"}`))
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
		ctx.SetContentType("application/json")
		ctx.Write([]byte("[]"))
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}

func browserScreenshotHandler(ctx *fasthttp.RequestCtx) {
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
		ctx.SetContentType("application/json")
		ctx.Write([]byte(`{"error": "screenshot failed"}`))
		return
	}
	defer resp.Body.Close()
	
	body, _ := io.ReadAll(resp.Body)
	ctx.SetContentType("application/json")
	ctx.Write(body)
}