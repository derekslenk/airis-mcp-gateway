# Project Overview

## Purpose
**Docker MCP Gateway** - Unified gateway to solve MCP server token explosion and multi-editor configuration hell.

Centralized Model Context Protocol (MCP) server management that:
- Eliminates token consumption (zero tokens until used)
- Provides dynamic on-demand tool loading
- Unifies configuration across all editors (Claude Code, Cursor, Windsurf, Zed)
- Runs all MCP servers inside Docker (zero host pollution)

## Tech Stack

### Infrastructure
- **Docker Compose**: Service orchestration
- **Docker MCP Gateway**: Custom gateway image (docker/mcp-gateway:latest)
- **OrbStack**: Mac-native Docker runtime

### MCP Servers (18 Total)
**Built-in** (enabled via --servers flag):
- time, fetch, git, memory, sequentialthinking

**Gateway NPX** (no auth required):
- filesystem, serena, puppeteer, sqlite

**API Integrations** (auth required, disabled by default):
- brave-search, github, mcp-postgres-server, stripe, twilio, figma, slack, sentry

**Editor-side** (outside Gateway due to bugs):
- context7 (library documentation search)

### Frontend (Settings UI)
- **Framework**: React 19.1.0
- **Build Tool**: Vite 7.0.3
- **Styling**: Tailwind CSS 3.4.17
- **Router**: React Router 7.6.3
- **i18n**: i18next 25.3.2, react-i18next 15.6.0
- **Language**: TypeScript 5.8.3
- **Backend Services**: Firebase 12.0.0, Supabase 2.57.4
- **Payments**: Stripe React 4.0.2
- **Charts**: Recharts 3.2.0

### Platform
- **OS**: macOS (Darwin)
- **Git**: Version control

## Architecture Pattern

```
Editors (Claude Code/Cursor/Windsurf/Zed)
    ↓ (mcp.json symlink)
Gateway (http://localhost:9090/sse)
    ├─ Built-in servers (5)
    ├─ Gateway NPX servers (4)
    └─ Disabled API servers (9)

Settings UI
    ↓ (port 5173 / Traefik: settings.airis.traefik)
React Frontend → Gateway API
```

## Project Status
- OSS release completed (MIT License)
- Bilingual documentation (English + Japanese)
- 18 MCP servers integrated
- Serena MCP auto-browser launch disabled
- Zero host pollution architecture achieved