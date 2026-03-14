# Rarclaw Control Center

[![Status](https://img.shields.io/badge/status-alpha-orange)](#)
[![Frontend](https://img.shields.io/badge/frontend-react%20%2B%20tailwind-06B6D4)](#)
[![Backend](https://img.shields.io/badge/backend-go-00ADD8)](#)


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

## Example Usage

- **Check gateway health / connectivity**
  - open the dashboard, confirm sessions + channels are visible

- **Watch a live session**
  - open the session list → click the active session → verify token/context counters update

- **Browse memory**
  - open Memory Explorer → search → open `MEMORY.md` or a `memory/YYYY-MM-DD.md` file

- **Remote browser control**
  - open Browser Remote → pick a tab → screenshot → click/type

If you tell me your OpenClaw gateway URL + auth model (local vs reverse proxy), I can add a concrete `config.json` example here.

## License

MIT
