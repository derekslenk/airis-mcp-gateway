# Debian Migration Checklist

Complete checklist for migrating AIRIS MCP Gateway from macOS to Debian.

## Pre-Migration

### On Debian Host

- [ ] Docker installed and running (`docker --version`)
- [ ] Docker Compose v2 installed (`docker compose version`)
- [ ] User added to docker group (`groups | grep docker`)
- [ ] SSH access configured from client machines
- [ ] Git installed (`git --version`)
- [ ] Network connectivity verified (ping from clients)
- [ ] Sufficient disk space (20GB+ free)
- [ ] Sufficient RAM (4GB+ recommended)

### On Client Machines

- [ ] SSH configured for Debian host (`~/.ssh/config`)
- [ ] VSCode Remote SSH extension installed (optional)
- [ ] Know where mcp.json is located for your editor
- [ ] Backup current mcp.json configuration

## Migration Steps

### 1. Repository Setup

- [ ] Clone repository to Debian: `~/projects/airis-mcp-gateway`
- [ ] Verify all files present
- [ ] Check git remote is correct

### 2. Configuration

- [ ] Create `.env` from `.env.debian.example`
- [ ] Update `WORKSPACE_PATH` in `.env` to actual username
- [ ] Update `docker-compose.yml` volume mounts (lines 25, 70)
- [ ] Update `mcp-config.json` paths (lines 42, 81, 100)
  - [ ] serena volume mount
  - [ ] mindbase volume mount
  - [ ] self-management volume mount
- [ ] Backup original config files (`.backup` suffix)

### 3. Environment Variables

- [ ] Add any required API keys to `.env`
  - [ ] TAVILY_API_KEY (if using)
  - [ ] STRIPE_SECRET_KEY (if using)
  - [ ] FIGMA_ACCESS_TOKEN (if using)
  - [ ] GITHUB_PERSONAL_ACCESS_TOKEN (if using)
  - [ ] Other API keys as needed

### 4. Build and Deploy

- [ ] Run build: `docker compose build`
- [ ] Start services: `docker compose up -d`
- [ ] Check all services running: `docker compose ps`
- [ ] Verify all services "Up" and healthy

### 5. Network Configuration

- [ ] Test local access: `curl http://localhost:9090/`
- [ ] Get Debian IP: `hostname -I` or `ip addr`
- [ ] Test network access from client: `curl http://192.168.15.123:9090/`
- [ ] Configure firewall if needed:
  - [ ] `sudo ufw allow 9090/tcp`
  - [ ] `sudo ufw allow 8000/tcp`
  - [ ] `sudo ufw allow 5173/tcp`

### 6. Client Configuration

For **each client machine**:

- [ ] Update mcp.json with gateway URL
  - [ ] Location found (varies by editor)
  - [ ] URL updated to `http://192.168.15.123:9090/sse`
  - [ ] Old localhost config removed or commented
  - [ ] File saved

### 7. Remote Editing Setup (Optional but Recommended)

- [ ] VSCode Remote SSH extension installed
- [ ] SSH config entry created (`~/.ssh/config`)
- [ ] Test SSH connection: `ssh debian-gateway`
- [ ] Test VSCode Remote connection
- [ ] Open workspace: `/home/USER/projects/`
- [ ] Verify can edit files remotely

### 8. Testing & Validation

#### Service Health

- [ ] Gateway accessible: `curl http://192.168.15.123:9090/`
- [ ] API accessible: `curl http://192.168.15.123:8000/health`
- [ ] Settings UI accessible: `http://192.168.15.123:5173`
- [ ] No errors in logs: `docker compose logs | grep -i error`

#### MCP Server Testing

In Claude Code (or your editor with MCP support):

- [ ] Test filesystem: "List files in workspace"
- [ ] Test git: "Show git status"
- [ ] Test memory: "Remember my name is X"
- [ ] Test sequentialthinking: "Use sequential thinking to solve X"
- [ ] Test context7: "Look up React documentation"
- [ ] Test serena: "Find all symbols in X file"

#### Multi-Client Testing

- [ ] Test from laptop/primary machine
- [ ] Test from secondary machine
- [ ] Test from tablet/other device (if applicable)
- [ ] Verify all clients can connect simultaneously

### 9. Code Migration

- [ ] Clone/copy your projects to Debian: `~/projects/`
- [ ] Verify git remotes are correct
- [ ] Test can commit/push from Debian
- [ ] Verify file permissions are correct

### 10. Production Setup

- [ ] Configure auto-start (systemd service)
  - [ ] Service file created: `/etc/systemd/system/airis-gateway.service`
  - [ ] Service enabled: `sudo systemctl enable airis-gateway`
  - [ ] Service started: `sudo systemctl start airis-gateway`
  - [ ] Service status verified: `sudo systemctl status airis-gateway`

- [ ] Set up backups
  - [ ] Volume backup script created
  - [ ] Database backup configured
  - [ ] Backup schedule set (cron)

- [ ] Resource monitoring
  - [ ] Check `docker stats` periodically
  - [ ] Monitor disk usage
  - [ ] Set up alerts (optional)

### 11. Documentation

- [ ] Update project README with Debian instructions
- [ ] Document any custom configuration
- [ ] Save API keys securely (not in git)
- [ ] Document network topology for team (if applicable)

## Post-Migration Verification

### Day 1

- [ ] All services running for 24 hours
- [ ] No unexpected restarts: `docker compose ps`
- [ ] Logs show no errors
- [ ] All clients working normally

### Week 1

- [ ] Performance is acceptable
- [ ] No resource issues (CPU, memory, disk)
- [ ] Backups working
- [ ] Auto-start working (test reboot)

## Rollback Plan

If issues occur:

### Quick Rollback to Local

- [ ] On client: Restore old mcp.json (localhost config)
- [ ] Start local MCP servers if needed
- [ ] Verify can work locally again

### Debian Debugging

- [ ] Check logs: `docker compose logs -f`
- [ ] Restart services: `docker compose restart`
- [ ] Check network: `ping 192.168.15.123`
- [ ] Check firewall: `sudo ufw status`
- [ ] Rebuild if needed: `docker compose down && docker compose build && docker compose up -d`

## Common Issues & Solutions

### Gateway not accessible from network

```bash
# Check binding
docker compose logs mcp-gateway | grep -i listen

# Check firewall
sudo ufw status
sudo ufw allow 9090/tcp

# Check port is open
sudo netstat -tulpn | grep 9090
```

### Docker permission denied

```bash
# Add to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

### Volume mount permission issues

```bash
# Check permissions
ls -la ~/projects

# Fix if needed
chmod 755 ~/projects
```

### Services won't start

```bash
# Check logs
docker compose logs

# Check disk space
df -h

# Check Docker daemon
sudo systemctl status docker
```

### Client can't connect

```bash
# From client
ping 192.168.15.123
telnet 192.168.15.123 9090

# Check mcp.json syntax
cat ~/.config/claude-code/mcp.json | jq .
```

## Automated Setup

For automated setup, you can use the provided script:

```bash
# On Debian host
cd ~/projects/airis-mcp-gateway
./scripts/setup-debian.sh
```

This script handles steps 1-5 automatically.

## Success Criteria

✅ Migration is successful when:

1. All services running on Debian
2. Accessible from all client machines
3. All MCP servers working via gateway
4. Code editable remotely (VSCode Remote SSH)
5. No errors in logs
6. Performance acceptable
7. Auto-start working
8. Backups configured

## Time Estimates

- **Manual Setup**: 1-2 hours (first time)
- **Automated Setup**: 15-30 minutes
- **Testing**: 30-60 minutes
- **Client Configuration**: 10 minutes per machine
- **Total**: 2-4 hours for complete migration

## Support

If you encounter issues:

1. Check logs: `docker compose logs -f`
2. Review documentation: `claudedocs/DEBIAN_DEPLOYMENT_GUIDE.md`
3. Check network: `ping` and `curl` tests
4. Verify configuration: `.env` and `mcp-config.json`
5. Test individual services: `docker compose ps`

---

**Checklist Version**: 1.0
**Last Updated**: 2025
**For**: Debian 11+ deployment
