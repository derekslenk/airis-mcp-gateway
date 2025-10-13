.PHONY: up down restart logs ps clean ui-build ui-up ui-down ui-logs ui-shell api-build api-logs api-shell db-migrate

# Start all services (Gateway, DB, API, UI)
up:
	docker compose up -d
	@echo "✅ All services started"
	@echo "🔗 Gateway: http://localhost:$${GATEWAY_PORT:-9090}"
	@echo "🗄️  Database: internal only"
	@echo "🚀 API: http://localhost:$${API_PORT:-8001} (docs: /docs)"
	@echo "🎨 UI: http://localhost:$${UI_PORT:-5173}"

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

# Settings UI operations
ui-build:
	docker compose build settings-ui
	@echo "✅ Settings UI image built"

ui-up:
	docker compose up -d settings-ui
	@echo "✅ Settings UI started"
	@echo "🎨 Port access: http://localhost:5173"
	@echo "🎨 Traefik access: http://settings.airis.traefik"

ui-down:
	docker compose stop settings-ui
	@echo "🛑 Settings UI stopped"

ui-logs:
	docker compose logs -f settings-ui

ui-shell:
	docker compose exec settings-ui sh

# API operations
api-build:
	docker compose build api
	@echo "✅ API image built"

api-logs:
	docker compose logs -f api

api-shell:
	docker compose exec api bash

# Database operations
db-migrate:
	docker compose exec api alembic upgrade head
	@echo "✅ Database migrations applied"
