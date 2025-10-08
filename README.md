# Docker MCP Gateway - Global MCP Server Management

Centralized Model Context Protocol (MCP) server infrastructure for all projects.

## 🎯 Architecture

```
Claude Code (any project)
    ↓
~/github/docker-mcp-gateway/mcp.json (Git-managed)
    ↓
Gateway (http://localhost:9090/sse)
│   ├─ time
│   ├─ fetch
│   ├─ git
│   ├─ memory
│   └─ sequentialthinking
│
└─ npx Direct Launch (4 servers)
    ├─ context7 (library docs)
    ├─ supabase (PostgreSQL)
    ├─ stripe (payments)
    └─ twilio (phone/SMS)
```

## 🚀 Quick Start

```bash
# Start all MCP servers + proxy
make up

# Stop all
make down

# View logs
make logs

# Show available servers
make info
```

## 📦 Available MCP Servers (9 Total)

### Gateway Servers (5) - Via http://localhost:9090/sse
| Server | Description |
|--------|-------------|
| time | Current time/date |
| fetch | Web content fetching |
| git | Git operations |
| memory | Persistent storage |
| sequentialthinking | Complex reasoning |

### Direct Launch Servers (4) - Via npx
| Server | Description | Requires |
|--------|-------------|----------|
| context7 | Library documentation search | - |
| supabase | PostgreSQL database access | Connection string |
| stripe | Payment APIs | `STRIPE_SECRET_KEY` |
| twilio | Voice/SMS APIs | Account SID + API keys |

## 🔧 Configuration

### 🔐 Secrets Management (Recommended)

Use Docker MCP secret store for secure API key management:

```bash
# Setup secrets (one-time)
docker mcp secret set STRIPE_API_KEY=sk_...
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set TWILIO_API_KEY=SK...
docker mcp secret set TWILIO_API_SECRET=...

# List secrets
docker mcp secret ls

# Remove secrets
docker mcp secret rm STRIPE_API_KEY
```

**Security Benefits**:
- ✅ Encrypted at rest in Docker Desktop
- ✅ Never stored in Git
- ✅ Runtime injection only
- ✅ OrbStack compatible

See [SECRETS.md](./SECRETS.md) for details.

### ⚠️ Environment Variables (Deprecated)

**Not recommended** - Use `docker mcp secret` instead.

### Client Configuration

The proxy is accessible at `http://localhost:9090`.

**Global config** (recommended):
```bash
~/.claude/mcp.json → github/docker-mcp-gateway/mcp.json (symlink)
```

**Per-project config** (optional):
```bash
~/github/agiletec/mcp.json → github/docker-mcp-gateway/mcp.json (symlink)
```

### Adding New MCP Servers

Edit `mcp-config.json`:

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

Then restart:
```bash
make restart
```

## 🔒 Security

- **Safe to commit**: `mcp-config.json`, `mcp.json`, `docker-compose.yml`
- **Never commit**: `.env` (contains actual API keys)
- **Version control**: All config in git, secrets in `.env`

## 📁 File Structure

```
docker-mcp-gateway/
├── docker-compose.yml      # All services (servers + proxy)
├── mcp-config.json         # Proxy configuration (17 servers)
├── mcp.json                # Claude Code client config
├── .env.example            # Environment variables template
├── .env                    # Actual secrets (.gitignored)
├── Makefile                # Shortcuts
├── README.md               # This file
└── context7/               # Custom MCP server builds
```

## 🐛 Troubleshooting

**Gateway not starting:**
```bash
docker logs docker-mcp-gateway
```

**Individual server issues:**
Check Gateway logs (includes all 5 Gateway servers):
```bash
make logs
```

npx servers (context7, supabase, stripe, twilio) log to Claude Code console.

**Clean restart:**
```bash
make clean
make up
```

**Check running services:**
```bash
make ps
```

## 🌐 Usage from Projects

All projects using the symlink automatically get updates when you modify `docker-mcp-gateway/mcp.json`.

**Current symlinks:**
- `~/.claude/mcp.json` (global)
- `~/github/agiletec/mcp.json` (agiletec project)

Add more as needed:
```bash
ln -sf ~/github/docker-mcp-gateway/mcp.json ~/github/your-project/mcp.json
```

## 🔗 Integration with Claude Code

Restart Claude Code after:
1. Starting/stopping the proxy
2. Modifying `mcp.json`
3. Adding new MCP servers

The proxy runs continuously - no need to restart for every project switch.
