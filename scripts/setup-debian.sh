#!/bin/bash
# AIRIS MCP Gateway - Debian Setup Script
# Run this on your Debian host to configure the gateway

set -e  # Exit on error

echo "========================================"
echo "AIRIS MCP Gateway - Debian Setup"
echo "========================================"
echo ""

# Detect username
CURRENT_USER=$(whoami)
WORKSPACE_PATH="/home/$CURRENT_USER/projects"

echo "Detected configuration:"
echo "  User: $CURRENT_USER"
echo "  Workspace: $WORKSPACE_PATH"
echo ""

# Check if running in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found"
    echo "   Please run this script from the airis-mcp-gateway directory"
    exit 1
fi

echo "Step 1: Checking prerequisites..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker first."
    echo "   See: https://docs.docker.com/engine/install/debian/"
    exit 1
fi
echo "✅ Docker found: $(docker --version)"

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose plugin."
    exit 1
fi
echo "✅ Docker Compose found: $(docker compose version)"

# Check if user is in docker group
if ! groups | grep -q docker; then
    echo "⚠️  Warning: User $CURRENT_USER is not in docker group"
    echo "   Adding to docker group (requires logout/login to take effect)..."
    sudo usermod -aG docker "$CURRENT_USER"
    echo "⚠️  Please logout and login again, then re-run this script"
    exit 0
fi
echo "✅ User in docker group"

echo ""
echo "Step 2: Creating environment configuration..."

# Create .env if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.debian.example" ]; then
        cp .env.debian.example .env
        # Replace placeholder with actual username
        sed -i "s|YOUR_USERNAME|$CURRENT_USER|g" .env
        echo "✅ Created .env from template"
    else
        echo "⚠️  .env.debian.example not found, creating minimal .env"
        cat > .env << EOF
GATEWAY_PORT=9090
API_PORT=8000
UI_PORT=5173
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=mcp_gateway
API_DEBUG=true
WORKSPACE_PATH=$WORKSPACE_PATH
EOF
    fi
    echo "✅ .env created with WORKSPACE_PATH=$WORKSPACE_PATH"
else
    echo "ℹ️  .env already exists, skipping"
fi

echo ""
echo "Step 3: Updating configuration files for Debian paths..."

# Backup original files
if [ ! -f "docker-compose.yml.backup" ]; then
    cp docker-compose.yml docker-compose.yml.backup
    echo "✅ Backed up docker-compose.yml"
fi

if [ ! -f "mcp-config.json.backup" ]; then
    cp mcp-config.json mcp-config.json.backup
    echo "✅ Backed up mcp-config.json"
fi

# Update docker-compose.yml
echo "ℹ️  Updating docker-compose.yml volume mounts..."
sed -i 's|/Users/kazuki/github:|${WORKSPACE_PATH}:|g' docker-compose.yml
echo "✅ Updated docker-compose.yml"

# Update mcp-config.json
echo "ℹ️  Updating mcp-config.json paths..."

# Check if envsubst is available
if command -v envsubst &> /dev/null; then
    # Use envsubst for variable substitution
    if [ ! -f "mcp-config.json.template" ]; then
        cp mcp-config.json mcp-config.json.template
    fi

    # Replace macOS paths with variable reference first
    sed -i 's|/Users/kazuki/github|${WORKSPACE_PATH}|g' mcp-config.json.template

    # Then substitute with actual value
    export WORKSPACE_PATH
    envsubst < mcp-config.json.template > mcp-config.json
    echo "✅ Updated mcp-config.json using envsubst"
else
    # Direct replacement with actual path
    sed -i "s|/Users/kazuki/github|$WORKSPACE_PATH|g" mcp-config.json
    echo "✅ Updated mcp-config.json (direct replacement)"
fi

echo ""
echo "Step 4: Verifying workspace directory..."
if [ ! -d "$WORKSPACE_PATH" ]; then
    echo "ℹ️  Creating workspace directory: $WORKSPACE_PATH"
    mkdir -p "$WORKSPACE_PATH"
    echo "✅ Created $WORKSPACE_PATH"
else
    echo "✅ Workspace directory exists: $WORKSPACE_PATH"
fi

echo ""
echo "Step 5: Building Docker images..."
echo "ℹ️  This may take several minutes on first run..."
docker compose build

echo ""
echo "Step 6: Starting services..."
docker compose up -d

echo ""
echo "Step 7: Waiting for services to start..."
sleep 5

echo ""
echo "Step 8: Checking service health..."
docker compose ps

echo ""
echo "========================================"
echo "✅ Setup Complete!"
echo "========================================"
echo ""
echo "Gateway Information:"
echo "  Gateway URL: http://localhost:9090"
echo "  API URL: http://localhost:8000"
echo "  Settings UI: http://localhost:5173"
echo ""
echo "Network Access (from other machines):"
IP_ADDR=$(hostname -I | awk '{print $1}')
echo "  Gateway: http://$IP_ADDR:9090/sse"
echo "  API: http://$IP_ADDR:8000"
echo "  Settings: http://$IP_ADDR:5173"
echo ""
echo "Client Configuration:"
echo "  Update mcp.json on your client machines to:"
echo "  {"
echo "    \"mcpServers\": {"
echo "      \"airis-mcp-gateway\": {"
echo "        \"url\": \"http://$IP_ADDR:9090/sse\","
echo "        \"description\": \"Debian Gateway\""
echo "      }"
echo "    }"
echo "  }"
echo ""
echo "Workspace Path: $WORKSPACE_PATH"
echo ""
echo "Next Steps:"
echo "  1. Test: curl http://localhost:9090/"
echo "  2. View logs: docker compose logs -f"
echo "  3. Update client mcp.json files"
echo "  4. Clone your projects to $WORKSPACE_PATH"
echo "  5. Set up VSCode Remote SSH for remote editing"
echo ""
echo "For detailed setup guide, see: claudedocs/DEBIAN_DEPLOYMENT_GUIDE.md"
echo ""

# Test gateway
echo "Testing gateway connectivity..."
if curl -s http://localhost:9090/ > /dev/null; then
    echo "✅ Gateway is accessible!"
else
    echo "⚠️  Gateway not responding yet. Check logs with: docker compose logs mcp-gateway"
fi

echo ""
echo "Setup script completed!"
