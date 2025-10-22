# Quick Start: Debian Gateway Deployment

**TL;DR**: 10-minute setup for Debian gateway deployment.

## Prerequisites
- Debian host: `192.168.15.123`
- Docker installed on Debian
- SSH access to Debian
- Code will live on Debian

## On Debian Host

```bash
# 1. Clone repo
ssh user@192.168.15.123
mkdir -p ~/projects && cd ~/projects
git clone <your-repo-url> airis-mcp-gateway
cd airis-mcp-gateway

# 2. Create environment config
cp .env.debian.example .env
nano .env
# Change YOUR_USERNAME to your actual username (e.g., derek)

# 3. Update paths in config (one-time setup)
# Option A: Use envsubst (recommended)
sudo apt install -y gettext-base
export WORKSPACE_PATH=/home/$USER/projects
cp mcp-config.json mcp-config.json.template
envsubst < mcp-config.json.template > mcp-config.json

# Option B: Or manually edit mcp-config.json
# Replace all /Users/kazuki/github with /home/YOUR_USERNAME/projects

# Also update docker-compose.yml volume mounts:
# Line 25 & 70: Change to ${WORKSPACE_PATH}:/workspace/github:rw

# 4. Build and start
docker compose build
docker compose up -d

# 5. Verify
docker compose ps
curl http://localhost:9090/
```

## On Client Machines

```bash
# 1. Update mcp.json
# Location: ~/.config/claude-code/mcp.json (or project-specific)
cat > ~/.config/claude-code/mcp.json << 'EOF'
{
  "mcpServers": {
    "airis-mcp-gateway": {
      "url": "http://192.168.15.123:9090/sse",
      "description": "Debian Gateway - All MCP servers"
    }
  }
}
EOF

# 2. Set up VSCode Remote SSH (optional but recommended)
code --install-extension ms-vscode-remote.remote-ssh

# Add to ~/.ssh/config:
cat >> ~/.ssh/config << 'EOF'
Host debian-gateway
    HostName 192.168.15.123
    User YOUR_USERNAME
    ForwardAgent yes
EOF

# 3. Connect and edit
# VSCode: Cmd+Shift+P → "Remote-SSH: Connect to Host" → debian-gateway
# Open folder: /home/YOUR_USERNAME/projects/
```

## Test

```bash
# From client machine
curl http://192.168.15.123:9090/

# In Claude Code
# Try: "List files in my projects directory"
# This should now use the filesystem MCP server via gateway
```

## Troubleshooting

```bash
# Gateway not accessible?
docker compose logs mcp-gateway

# Port issues?
sudo ufw allow 9090/tcp

# Docker permission denied?
sudo usermod -aG docker $USER
# Then logout and login again
```

## What You Get

- ✅ Gateway: `http://192.168.15.123:9090`
- ✅ API: `http://192.168.15.123:8000`
- ✅ Settings UI: `http://192.168.15.123:5173`
- ✅ 15+ MCP servers accessible from any client
- ✅ Code on Debian, editable remotely
- ✅ Single source of truth

## Full Guide

For detailed explanation, security, backups, etc., see: `DEBIAN_DEPLOYMENT_GUIDE.md`
