package main

import (
	"time"

	"github.com/gorilla/websocket"
	"github.com/valyala/fasthttp"
)

var clients = make(map[*websocket.Conn]bool)

func websocketHandler(ctx *fasthttp.RequestCtx) {
	// Fasthttp doesn't play well with gorilla websocket
	// Return error for now - frontend can use polling
	ctx.SetContentType("application/json")
	ctx.Write([]byte(`{"error": "WebSocket not implemented, use polling"}`))
	ctx.SetStatusCode(501)
}

func sendUpdate(conn *websocket.Conn, event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
		"time":  time.Now().Unix(),
	}
	conn.WriteJSON(msg)
}

func broadcast(event string, data interface{}) {
	msg := map[string]interface{}{
		"event": event,
		"data":  data,
		"time":  time.Now().Unix(),
	}
	for conn := range clients {
		conn.WriteJSON(msg)
	}
}