# Docker MCP Gateway

**Unified Gateway to Solve MCP Server Token Explosion**

Centralized Model Context Protocol (MCP) server management to solve IDE token consumption and multi-editor configuration hell.

**[日本語 README](./README.ja.md)**

---

## 🎯 Problems We Solve

### Problem 1: Token Explosion
- **Massive tool descriptions** → IDE loads all tool definitions on startup
- **Performance degradation** → IDE hangs or slows when token threshold exceeded
- **Token waste on unused tools** → Loading descriptions for tools you never use

### Problem 2: Multi-Editor Configuration Hell
```
Cursor     → mcp.json (custom format)
Windsurf   → mcp.json (slightly different)
Zed        → mcp.json (different again)
VS Code    → settings.json (completely different)
```
**Result**: Maintaining separate MCP configs per editor = maintenance hell

### Problem 3: Per-Project Duplication
- Each project spawns MCP servers → Memory/CPU waste
- API keys scattered across multiple `.env` files → Security risk

---

## ✨ Solution

### 🚀 Gateway Pattern

```
Claude Code / Cursor / Windsurf / Zed
    ↓
Gateway (http://localhost:9090/sse)
│   ├─ time (2 tools)
│   ├─ fetch (1 tool)
│   ├─ git (12 tools)
│   ├─ memory (9 tools)
│   ├─ sequentialthinking (1 tool)
│   └─ serena (1 tool)
│
└─ Direct Launch (npx)
    ├─ context7 (library documentation)
    ├─ mcp-postgres-server (PostgreSQL → Supabase self-hosted)
    ├─ stripe (payment API)
    └─ twilio (phone/SMS API)
```

**How It Works**:
1. **IDE only knows Gateway URL** → No tool descriptions sent (0 tokens)
2. **Dynamic loading on demand** → Tool definitions loaded only when explicitly requested
3. **Single config file** → `mcp.json` symlinked across all editors and projects

**Benefits**:
- ✅ **Zero token consumption** (until you use it)
- ✅ **Dynamic loading** (on-demand only)
- ✅ **Unified management** (single config file)
- ✅ **Secure API keys** (Docker secrets)

---

## 🚀 Quick Start

### 1. Installation

```bash
git clone https://github.com/kazukinakai/docker-mcp-gateway.git ~/github/docker-mcp-gateway
cd ~/github/docker-mcp-gateway
```

### 2. Start Gateway

```bash
make up    # Start Gateway + all MCP servers
```

### 3. Connect Your Editor

#### Global config (recommended)
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/.claude/mcp.json
```

#### Per-project config
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

### 4. Restart Editor

Changes will take effect after editor restart.

---

## 📦 Available MCP Servers (18 Total)

### Gateway Servers (6 servers / 26 tools)
| Server | Tools | Description |
|--------|-------|-------------|
| **time** | 2 | Current time/date operations |
| **fetch** | 1 | Web content fetching |
| **git** | 12 | Git repository operations |
| **memory** | 9 | Persistent knowledge storage |
| **sequentialthinking** | 1 | Complex problem-solving |
| **serena** | 1 | Symbol search (Python/Go) |

### Direct Launch (npx/uvx) - No Auth Required
| Server | Description |
|--------|-------------|
| **context7** | Library documentation search |
| **filesystem** | Secure file operations with access controls |
| **puppeteer** | Browser automation and web scraping |

### Direct Launch - Auth Required
| Server | Description | Required Credentials |
|--------|-------------|---------------------|
| **brave-search** | Web/news/image/video search | `BRAVE_API_KEY` |
| **github** | GitHub repository operations | `GITHUB_PERSONAL_ACCESS_TOKEN` |
| **mcp-postgres-server** | PostgreSQL operations (Supabase compatible) | `POSTGRES_CONNECTION_STRING` |
| **sqlite** | SQLite database operations | `SQLITE_DB_PATH` (optional) |
| **stripe** | Payment APIs | `STRIPE_SECRET_KEY` |
| **twilio** | Phone/SMS APIs | `TWILIO_ACCOUNT_SID`, `TWILIO_API_KEY`, `TWILIO_API_SECRET` |
| **figma** | Figma design file access | `FIGMA_ACCESS_TOKEN` |
| **slack** | Slack workspace integration | `SLACK_BOT_TOKEN`, `SLACK_TEAM_ID` |
| **sentry** | Error monitoring and debugging | `SENTRY_AUTH_TOKEN`, `SENTRY_ORG` |

---

## 🔧 Configuration

### 🔐 API Key Management (Recommended: Docker secrets)

```bash
# Register secrets (one-time setup)
docker mcp secret set STRIPE_SECRET_KEY=sk_...
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set TWILIO_API_KEY=SK...
docker mcp secret set TWILIO_API_SECRET=...
docker mcp secret set FIGMA_ACCESS_TOKEN=figd_...

# List secrets
docker mcp secret ls

# Remove secrets
docker mcp secret rm STRIPE_SECRET_KEY
```

**Security Benefits**:
- ✅ Encrypted storage in Docker Desktop
- ✅ Never committed to Git
- ✅ Runtime injection only
- ✅ OrbStack compatible

See [SECRETS.md](./SECRETS.md) for details.

### 🎛️ Enable/Disable MCP Servers

Edit `mcp.json` to enable or disable servers:

```bash
# Edit master config
vim ~/github/docker-mcp-gateway/mcp.json
# or
code ~/github/docker-mcp-gateway/mcp.json
```

**To disable**: Remove server entry
```json
{
  "mcpServers": {
    "docker-mcp-gateway": { ... },
    "context7": { ... },
    // "puppeteer": { ... }  ← Remove this server
  }
}
```

**To enable**: Add server definition to `mcp.json`
```json
{
  "mcpServers": {
    "your-new-server": {
      "command": "npx",
      "args": ["-y", "@your/mcp-package"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      },
      "description": "Your server description"
    }
  }
}
```

**Restart editor**: Apply changes
```bash
# For Claude Code
# Select "Restart" from menu
```

### Add New MCP Server (via Gateway)

To add servers via Gateway, edit `mcp-config.json`:

```json
{
  "mcpServers": {
    "your-server": {
      "command": "npx",
      "args": ["-y", "@your/mcp-server"],
      "env": {
        "API_KEY": "${YOUR_API_KEY}"
      }
    }
  }
}
```

Restart:
```bash
make restart
```

---

## 🛠️ Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all services |
| `make down` | Stop all services |
| `make restart` | Restart services |
| `make logs` | Show all logs |
| `make ps` | Show container status |
| `make info` | Show available servers |
| `make clean` | Cleanup |

## 📁 File Structure

```
docker-mcp-gateway/
├── docker-compose.yml      # All services (Gateway + MCP servers)
├── mcp-config.json         # Gateway config (internal MCP servers)
├── mcp.json                # Client config (editor-side)
├── .env.example            # Environment variables template
├── .env                    # Actual secrets (.gitignored)
├── Makefile                # Shortcuts
├── README.md               # English
├── README.ja.md            # Japanese
└── SECRETS.md              # Secrets management guide
```

---

## 🌐 Multi-Editor & Multi-Project Support

### Unified Management

```
~/github/docker-mcp-gateway/mcp.json (master config)
    ↓ symlink
├─ ~/.claude/mcp.json (Claude Code global)
├─ ~/github/agiletec/mcp.json (agiletec project)
├─ ~/github/neural/mcp.json (neural project)
└─ ~/github/storage-smart/mcp.json (storage-smart project)
```

**Benefits**:
- Master config updates → Auto-reflected in all editors/projects
- Absorbs per-editor configuration differences
- MCP servers always running when switching projects

**Add more projects**:
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

---

## 🔒 Security

- **Safe to commit**: `mcp-config.json`, `mcp.json`, `docker-compose.yml`
- **Never commit**: `.env` (contains actual API keys)
- **Recommended**: Use Docker MCP secrets (no `.env` needed, more secure)

---

## 🐛 Troubleshooting

### Gateway not starting
```bash
docker logs docker-mcp-gateway
```

### Individual MCP server issues
```bash
# Gateway servers
make logs

# npx launch servers (logged to editor console)
# context7, mcp-postgres-server, stripe, twilio
```

### Clean restart
```bash
make clean
make up
```

### Check running services
```bash
make ps
```

---

## 🔗 Editor Integration

Restart editor after:
1. Starting/stopping Gateway
2. Modifying `mcp.json`
3. Adding new MCP servers

Gateway runs continuously - no restart needed when switching projects.

---

## 🤝 Contributing

Issues and Pull Requests welcome!

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Create Pull Request

---

## 📄 License

MIT License - Feel free to use

---

## 💬 Author

[@kazukinakai](https://github.com/kazukinakai)

Created to solve MCP server token explosion and configuration hell.
