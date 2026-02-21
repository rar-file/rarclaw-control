package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gorilla/websocket"
	"github.com/valyala/fasthttp"
)

var clients = make(map[*websocket.Conn]bool)

func websocketHandler(ctx *fasthttp.RequestCtx) {
	// Convert fasthttp to net/http for gorilla websocket
	httpHandler := func(w http.ResponseWriter, r *http.Request) {
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Printf("WebSocket upgrade failed: %v", err)
			return
		}
		defer conn.Close()
		
		clients[conn] = true
		defer delete(clients, conn)
		
		// Send initial data
		sendUpdate(conn, "connected", map[string]string{
			"gateway": gatewayURL,
			"time":    time.Now().Format(time.RFC3339),
		})
		
		// Keep connection alive and broadcast updates
		ticker := time.NewTicker(5 * time.Second)
		defer ticker.Stop()
		
		for {
			select {
			case <-ticker.C:
				sendUpdate(conn, "ping", map[string]string{
					"time": time.Now().Format(time.RFC3339),
				})
			}
		}
	}
	
	// This is a hack - fasthttp doesn't play nice with gorilla websocket
	// In production, use a proper HTTP server for websockets
	ctx.Error("WebSocket endpoint - use polling for now", 501)
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