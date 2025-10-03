.PHONY: up down restart logs ps clean

# Start all MCP services and proxy
up:
	docker compose up -d
	@echo "✅ MCP servers and proxy started"
	@echo "🔗 Proxy: http://localhost:9090"

# Stop all services
down:
	docker compose down

# Restart all services
restart:
	docker compose restart

# Show logs
logs:
	docker compose logs -f

# Show logs for specific service
logs-%:
	docker compose logs -f $*

# Show running containers
ps:
	docker compose ps

# Clean up (WARNING: destroys data)
clean:
	docker compose down -v
	@echo "⚠️  All volumes removed"

# Show available MCP servers
info:
	@echo "📦 Available MCP Servers:"
	@grep -A 2 '"mcpServers"' mcp-config.json | grep -o '"[^"]*":' | sed 's/[":,]//g' | tail -n +2
