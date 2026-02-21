# Rarclaw Control Center

A web dashboard for OpenClaw. Monitor sessions, memory, cron jobs, channels, and browser — all in one place.

## Features

- **Live Session View** — Real-time token usage, context window, active turns
- **Memory Explorer** — Browse, search, edit MEMORY.md and memory files
- **Cron Dashboard** — Visual scheduler, create/edit jobs, view run history
- **Channel Hub** — Telegram, Discord, Slack status and recent messages
- **Browser Remote** — View tabs, screenshots, click/type remotely
- **GitHub Panel** — Your repos, commits, issues I'm tracking

## Tech Stack

- **Backend**: Go (FastHTTP + Gorilla WebSocket)
- **Frontend**: React + Tailwind CSS (dark mode default)
- **Real-time**: WebSocket to OpenClaw Gateway
- **Storage**: SQLite (local state cache)

## Quick Start

```bash
cd backend && go run main.go
cd frontend && npm install && npm run dev
```

## License

MIT