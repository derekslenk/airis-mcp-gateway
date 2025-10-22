# Debian Gateway Deployment Guide

Complete guide for deploying AIRIS MCP Gateway on Debian host (192.168.15.123) with remote editing workflow.

## Architecture Overview

```
┌─────────────────────────┐
│ Client Machine 1        │
│ (Claude Code/Cursor)    │
│                         │
│ VSCode Remote SSH ──────┼───┐
│ mcp.json ───────────────┼───┤
└─────────────────────────┘   │
                              │
┌─────────────────────────┐   │
│ Client Machine 2        │   │
│ (any editor)            │   │
│                         │   │
│ Remote editing ─────────┼───┤
│ mcp.json ───────────────┼───┤
└─────────────────────────┘   │
                              ↓
                    ┌──────────────────────────┐
                    │ Debian Host              │
                    │ 192.168.15.123          │
                    │                          │
                    │ /home/USER/projects/    │
                    │   ├─ repo1/              │
                    │   ├─ repo2/              │
                    │   └─ airis-mcp-gateway/ │
                    │                          │
                    │ Docker Services:         │
                    │   ├─ Gateway :9090       │
                    │   ├─ API :8000           │
                    │   └─ Settings UI :5173   │
                    └──────────────────────────┘
```

## Prerequisites on Debian Host

### 1. System Requirements
- Debian 11+ (Bullseye or newer)
- Docker Engine 20.10+
- Docker Compose 2.0+
- Git
- 4GB+ RAM recommended
- 20GB+ disk space

### 2. Install Docker (if not present)

```bash
# Update package index
sudo apt update

# Install dependencies
sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

# Set up Docker repository
echo \
  "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
  "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add your user to docker group (logout/login required)
sudo usermod -aG docker $USER
```

**Logout and login again for docker group to take effect**

### 3. Verify Docker Installation

```bash
docker --version
docker compose version
docker ps
```

## Deployment Steps

### Step 1: Clone Repository on Debian

```bash
# SSH into Debian
ssh user@192.168.15.123

# Create projects directory
mkdir -p ~/projects
cd ~/projects

# Clone the gateway
git clone https://github.com/yourusername/airis-mcp-gateway.git
cd airis-mcp-gateway

# Or if already cloned from another location, just copy it
```

### Step 2: Create Environment Configuration

Create `.env` file for Debian-specific settings:

```bash
cat > .env << 'EOF'
# === Debian Gateway Configuration ===

# Port Configuration
GATEWAY_PORT=9090
API_PORT=8000
UI_PORT=5173

# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mcp_gateway

# API Configuration
API_DEBUG=true

# === Path Configuration ===
# Update this to your Debian home directory
WORKSPACE_PATH=/home/YOUR_USERNAME/projects

# === Optional API Keys (enable servers as needed) ===
# TAVILY_API_KEY=your_key_here
# STRIPE_SECRET_KEY=your_key_here
# FIGMA_ACCESS_TOKEN=your_key_here
# GITHUB_PERSONAL_ACCESS_TOKEN=your_key_here
# BRAVE_API_KEY=your_key_here
EOF

# Edit and set your username
nano .env
# Change YOUR_USERNAME to your actual username
```

### Step 3: Update Configuration Files

#### A. Update docker-compose.yml

Edit volume mounts for Linux paths:

```bash
# Backup original
cp docker-compose.yml docker-compose.yml.backup

# Update the file
nano docker-compose.yml
```

Change **line 25** from:
```yaml
      - /Users/kazuki/github:/workspace/github:rw
```
To:
```yaml
      - ${WORKSPACE_PATH}:/workspace/github:rw
```

Change **line 70** from:
```yaml
      - /Users/kazuki/github:/workspace/github:rw
```
To:
```yaml
      - ${WORKSPACE_PATH}:/workspace/github:rw
```

#### B. Update mcp-config.json

Edit MCP server paths:

```bash
nano mcp-config.json
```

**Line 42** (serena volume mount):
Change:
```json
        "/Users/kazuki/github:/workspaces/projects:rw",
```
To:
```json
        "${WORKSPACE_PATH}:/workspaces/projects:rw",
```

**Line 81** (mindbase volume mount):
Change:
```json
        "/Users/kazuki/github/airis-mcp-gateway/servers/mindbase:/app:ro",
```
To:
```json
        "${WORKSPACE_PATH}/airis-mcp-gateway/servers/mindbase:/app:ro",
```

**Line 100** (self-management volume mount):
Change:
```json
        "/Users/kazuki/github/airis-mcp-gateway/servers/self-management:/app:ro",
```
To:
```json
        "${WORKSPACE_PATH}/airis-mcp-gateway/servers/self-management:/app:ro",
```

**Note**: mcp-config.json doesn't natively support env vars. You have two options:

**Option A: Use envsubst (recommended)**
```bash
# Install gettext-base if not present
sudo apt install -y gettext-base

# Create a template file
mv mcp-config.json mcp-config.json.template

# Generate actual config from template
export WORKSPACE_PATH=/home/$USER/projects
envsubst < mcp-config.json.template > mcp-config.json
```

**Option B: Hardcode your actual path**
Just replace with your actual path like `/home/derek/projects`

### Step 4: Build Custom Gateway Image

The gateway needs to be built locally (custom image):

```bash
cd ~/projects/airis-mcp-gateway

# Build the gateway image
docker compose build mcp-gateway

# Build other services
docker compose build api settings-ui
```

### Step 5: Start Services

```bash
# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f mcp-gateway
```

### Step 6: Verify Gateway is Accessible

```bash
# On Debian host
curl http://localhost:9090/

# From client machine (test network access)
curl http://192.168.15.123:9090/
```

Expected response: Some JSON or HTML indicating gateway is running.

### Step 7: Configure Firewall (if needed)

```bash
# Allow ports if firewall is enabled
sudo ufw allow 9090/tcp comment 'MCP Gateway'
sudo ufw allow 8000/tcp comment 'API'
sudo ufw allow 5173/tcp comment 'Settings UI'

# Check status
sudo ufw status
```

## Client Configuration

### Step 8: Update mcp.json on Client Machines

On **each client machine** (laptop, desktop, etc.), update the `mcp.json`:

**Location**:
- macOS/Linux: `~/.config/claude-code/mcp.json` or project-specific
- Windows: `%APPDATA%\claude-code\mcp.json`

**Content**:
```json
{
  "mcpServers": {
    "airis-mcp-gateway": {
      "url": "http://192.168.15.123:9090/sse",
      "description": "Debian Gateway - All MCP servers via unified gateway"
    }
  }
}
```

**Note**: The current mcp.json in the repo has wrong port (9000 instead of 9090). Use 9090 for SSE transport.

### Step 9: Set Up Remote Editing (VSCode Example)

#### Install VSCode Remote SSH Extension

```bash
# On client machine
code --install-extension ms-vscode-remote.remote-ssh
```

#### Configure SSH

Edit `~/.ssh/config`:

```
Host debian-gateway
    HostName 192.168.15.123
    User YOUR_USERNAME
    ForwardAgent yes
    ServerAliveInterval 60
```

#### Connect to Debian

1. Open VSCode
2. Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
3. Type "Remote-SSH: Connect to Host"
4. Select `debian-gateway`
5. Open folder: `/home/YOUR_USERNAME/projects/`

Now you're editing code directly on the Debian host!

## Testing & Validation

### Test Checklist

```bash
# On Debian host
cd ~/projects/airis-mcp-gateway

# 1. Check all services are running
docker compose ps
# Expected: All services "Up" and healthy

# 2. Check gateway is accessible
curl http://localhost:9090/
curl http://192.168.15.123:9090/

# 3. Check API is accessible
curl http://localhost:8000/health

# 4. Check Settings UI
curl http://localhost:5173/
# Or open in browser: http://192.168.15.123:5173

# 5. Check logs for errors
docker compose logs mcp-gateway | grep -i error
docker compose logs api | grep -i error
```

### Test from Client Machine

```bash
# From your laptop/desktop
# 1. Network connectivity
ping 192.168.15.123

# 2. Gateway port
curl http://192.168.15.123:9090/

# 3. Test with Claude Code
# Open Claude Code
# Run a command that uses MCP server (e.g., list files)
# Check that it connects to gateway
```

### Test MCP Servers

Open Claude Code on client and test:

```
1. Test filesystem: "List files in my projects directory"
2. Test git: "Show git status"
3. Test memory: "Remember that my favorite color is blue"
4. Test context7: "Look up React useEffect documentation"
```

## Service Management

### Common Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Restart services
docker compose restart

# View logs
docker compose logs -f

# View specific service logs
docker compose logs -f mcp-gateway

# Rebuild after changes
docker compose up -d --build

# Check resource usage
docker stats
```

### Auto-start on Boot

Create systemd service:

```bash
sudo nano /etc/systemd/system/airis-gateway.service
```

Content:
```ini
[Unit]
Description=AIRIS MCP Gateway
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/home/YOUR_USERNAME/projects/airis-mcp-gateway
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
User=YOUR_USERNAME

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable airis-gateway.service
sudo systemctl start airis-gateway.service
sudo systemctl status airis-gateway.service
```

## Troubleshooting

### Gateway Not Accessible

```bash
# Check if running
docker compose ps

# Check logs
docker compose logs mcp-gateway

# Check port binding
sudo netstat -tulpn | grep 9090

# Check firewall
sudo ufw status
```

### Volume Mount Issues

```bash
# Verify path exists
ls -la ~/projects

# Check docker can access
docker run --rm -v ~/projects:/test alpine ls -la /test

# Check permissions
ls -la ~/projects
```

### Docker Socket Permission Denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again
exit
# Then SSH back in
```

### Network Connectivity Issues

```bash
# From client
ping 192.168.15.123
telnet 192.168.15.123 9090

# On Debian
sudo ufw status
sudo iptables -L -n
```

## Updating the Gateway

```bash
cd ~/projects/airis-mcp-gateway

# Pull latest changes
git pull

# Rebuild and restart
docker compose down
docker compose build
docker compose up -d

# Check logs
docker compose logs -f
```

## Security Considerations (LAN Trust Model)

Since you're on a trusted LAN with no auth required:

### Current Security Posture
- ✅ Containers isolated from host
- ✅ Services bound to all interfaces (0.0.0.0)
- ✅ Trusted LAN only (192.168.15.0/24)
- ⚠️ No authentication (LAN trust model)
- ⚠️ No TLS encryption (HTTP only)

### If You Ever Need to Expose Outside LAN

**Don't expose directly to internet!** Instead:

1. **Use VPN**: Set up WireGuard/Tailscale
2. **Add Authentication**: Use Traefik with OAuth
3. **Use TLS**: Add HTTPS with Let's Encrypt
4. **Firewall**: Restrict to specific IPs

## Performance Optimization

### Resource Limits (Optional)

Add to docker-compose.yml services:

```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 2G
    reservations:
      memory: 512M
```

### Monitor Resources

```bash
# Real-time stats
docker stats

# Disk usage
docker system df

# Clean up
docker system prune -a
```

## Backup Strategy

### What to Backup

```bash
# 1. Configuration
~/projects/airis-mcp-gateway/.env
~/projects/airis-mcp-gateway/mcp-config.json
~/projects/airis-mcp-gateway/docker-compose.yml

# 2. Data volumes
docker volume ls
# claude-memory
# postgres_data

# 3. Your code
~/projects/
```

### Backup Commands

```bash
# Backup volumes
docker run --rm \
  -v claude-memory:/source:ro \
  -v ~/backups:/backup \
  alpine tar czf /backup/claude-memory-$(date +%Y%m%d).tar.gz -C /source .

# Backup postgres
docker compose exec postgres pg_dump -U postgres mcp_gateway > ~/backups/postgres-$(date +%Y%m%d).sql
```

## Summary

You now have:
- ✅ Gateway running on Debian (192.168.15.123:9090)
- ✅ API running on port 8000
- ✅ Settings UI on port 5173
- ✅ All MCP servers accessible via gateway
- ✅ Code stored on Debian, editable remotely
- ✅ Multiple client machines can connect
- ✅ Automatic startup on boot (if systemd configured)

## Next Steps

1. **Test from all client machines** - Verify each can connect
2. **Set up remote editing** - VSCode Remote SSH or similar
3. **Enable API servers** - Add API keys to `.env` as needed
4. **Configure backups** - Set up automated backup schedule
5. **Monitor performance** - Use `docker stats` regularly

## Support & References

- Project README: `README.md`
- Architecture: `ARCHITECTURE.md`
- Secrets Management: `SECRETS.md`
- Original Config: `docker-compose.yml.backup`
