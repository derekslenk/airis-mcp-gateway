# ================================
# AIRIS MCP Gateway Makefile
# ================================
# Docker-First standalone project
# ================================

.DEFAULT_GOAL := help

# ========== Environment Settings ==========
export COMPOSE_DOCKER_CLI_BUILD := 1
export DOCKER_BUILDKIT := 1

# Auto-detect project name from directory
PROJECT ?= $(notdir $(shell pwd))
export COMPOSE_PROJECT_NAME := $(PROJECT)

# Colors
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# ========== Help ==========
.PHONY: help
help:
	@echo ""
	@echo "$(BLUE)Available Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Project: $(PROJECT)$(NC)"
	@echo ""

# ========== Core Commands ==========

.PHONY: up
up: ## Start all services
	@echo "$(GREEN)Starting services...$(NC)"
	@docker compose up -d --remove-orphans
	@echo "$(GREEN)✅ All services started$(NC)"
	@echo "🔗 Gateway: http://localhost:$${GATEWAY_PORT:-9090}"
	@echo "🗄️  Database: internal only"
	@echo "🚀 API: http://localhost:$${API_PORT:-8001} (docs: /docs)"
	@echo "🎨 UI: http://localhost:$${UI_PORT:-5173}"

.PHONY: down
down: ## Stop all services
	@echo "$(YELLOW)Stopping services...$(NC)"
	@docker compose down --remove-orphans
	@echo "$(GREEN)✅ Stopped$(NC)"

.PHONY: restart
restart: down up ## Full restart

.PHONY: logs
logs: ## Show logs (all services)
	@docker compose logs -f

.PHONY: logs-%
logs-%: ## Show logs for specific service
	@docker compose logs -f $*

.PHONY: ps
ps: ## Show container status
	@docker compose ps

# ========== Clean Commands ==========

.PHONY: clean
clean: ## Clean Mac host garbage - ALL build artifacts should be in Docker volumes
	@echo "$(YELLOW)🧹 Cleaning Mac host garbage (Docker-First violation artifacts)...$(NC)"
	@echo "$(YELLOW)   ⚠️  These files should NOT exist on Mac host in Docker-First dev$(NC)"
	@find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "out" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".turbo" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".cache" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".swc" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".eslintcache" -type f -delete 2>/dev/null || true
	@find . -name "*.tsbuildinfo" -type f -delete 2>/dev/null || true
	@find . -name ".DS_Store" -type f -delete 2>/dev/null || true
	@find . -name "__pycache__" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "*.pyc" -type f -delete 2>/dev/null || true
	@echo "$(GREEN)✅ Mac host cleaned$(NC)"
	@echo "$(GREEN)   If files were found, your Docker volume setup needs fixing!$(NC)"

.PHONY: clean-all
clean-all: ## Complete cleanup (WARNING: destroys data)
	@echo "$(YELLOW)⚠️  WARNING: This will destroy all data (volumes)$(NC)"
	@docker compose down -v --remove-orphans
	@echo "$(GREEN)✅ Complete cleanup done$(NC)"

# ========== Info ==========

.PHONY: info
info: ## Show available MCP servers
	@echo "$(BLUE)📦 Available MCP Servers:$(NC)"
	@grep -A 2 '"mcpServers"' mcp-config.json | grep -o '"[^"]*":' | sed 's/[":,]//g' | tail -n +2

.PHONY: config
config: ## Show effective docker compose configuration
	@docker compose config

# ========== Settings UI ==========

.PHONY: ui-build
ui-build: ## Build Settings UI image
	@docker compose build settings-ui
	@echo "$(GREEN)✅ Settings UI image built$(NC)"

.PHONY: ui-up
ui-up: ## Start Settings UI
	@docker compose up -d settings-ui
	@echo "$(GREEN)✅ Settings UI started$(NC)"
	@echo "🎨 http://localhost:5173"

.PHONY: ui-down
ui-down: ## Stop Settings UI
	@docker compose stop settings-ui
	@echo "$(GREEN)🛑 Settings UI stopped$(NC)"

.PHONY: ui-logs
ui-logs: ## Show Settings UI logs
	@docker compose logs -f settings-ui

.PHONY: ui-shell
ui-shell: ## Enter Settings UI shell
	@docker compose exec settings-ui sh

# ========== API ==========

.PHONY: api-build
api-build: ## Build API image
	@docker compose build api
	@echo "$(GREEN)✅ API image built$(NC)"

.PHONY: api-logs
api-logs: ## Show API logs
	@docker compose logs -f api

.PHONY: api-shell
api-shell: ## Enter API shell
	@docker compose exec api bash

# ========== MindBase MCP Server ==========

.PHONY: mindbase-build
mindbase-build: ## Build MindBase MCP Server (TypeScript → dist/)
	@echo "$(BLUE)🔨 Building MindBase MCP Server...$(NC)"
	@docker compose --profile builder up --build -d mindbase-builder
	@echo "$(YELLOW)⏳ Waiting for build to complete...$(NC)"
	@timeout 120 sh -c 'until [ -f servers/mindbase/dist/index.js ]; do printf "."; sleep 1; done' || (echo "$(RED)❌ Build timeout$(NC)"; exit 1)
	@echo ""
	@echo "$(GREEN)✅ MindBase MCP Server built$(NC)"
	@ls -lh servers/mindbase/dist/
	@docker compose --profile builder stop mindbase-builder

.PHONY: mindbase-clean
mindbase-clean: ## Clean MindBase build artifacts
	@echo "$(YELLOW)🧹 Cleaning MindBase build artifacts...$(NC)"
	@rm -rf servers/mindbase/dist 2>/dev/null || true
	@echo "$(GREEN)✅ Cleaned$(NC)"

# ========== Database ==========

.PHONY: db-migrate
db-migrate: ## Run database migrations
	@docker compose exec api alembic upgrade head
	@echo "$(GREEN)✅ Database migrations applied$(NC)"

.PHONY: db-shell
db-shell: ## Enter PostgreSQL shell
	@docker compose exec postgres psql -U $${POSTGRES_USER:-postgres} -d $${POSTGRES_DB:-mcp_gateway}

# ========== Test ==========

.PHONY: test
test: ## Run tests in Docker
	@echo "$(BLUE)🧪 Running tests in Docker...$(NC)"
	@docker compose run --rm test
	@echo "$(GREEN)✅ Tests completed$(NC)"

# ========== Claude Code Integration ==========

.PHONY: install-claude
install-claude: ## Install and register with Claude Code (one-command setup)
	@echo "$(BLUE)🌉 Installing AIRIS MCP Gateway for Claude Code...$(NC)"
	@$(MAKE) up
	@echo "$(YELLOW)⏳ Waiting for Gateway to become healthy (max 60s)...$(NC)"
	@timeout 60 sh -c 'until docker inspect --format "{{.State.Health.Status}}" airis-mcp-gateway 2>/dev/null | grep -q "healthy"; do printf "."; sleep 1; done' || (echo "$(RED)❌ Gateway failed to become healthy$(NC)"; exit 1)
	@echo ""
	@echo "$(GREEN)✅ Gateway healthy$(NC)"
	@echo "$(BLUE)📝 Creating configuration symlink...$(NC)"
	@mkdir -p $(HOME)/.claude
	@if [ -f $(HOME)/.claude/mcp.json ] && [ ! -L $(HOME)/.claude/mcp.json ]; then \
		BACKUP="$(HOME)/.claude/mcp.json.backup.$$(date +%Y%m%d_%H%M%S)"; \
		echo "$(YELLOW)⚠️  Backing up existing config to: $$BACKUP$(NC)"; \
		cp $(HOME)/.claude/mcp.json $$BACKUP; \
	fi
	@rm -f $(HOME)/.claude/mcp.json
	@ln -s $(PWD)/mcp.json $(HOME)/.claude/mcp.json
	@echo "$(GREEN)✅ Configuration symlink created$(NC)"
	@echo ""
	@echo "$(GREEN)🎉 Installation complete!$(NC)"
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "$(BLUE)Next Steps:$(NC)"
	@echo "  1. $(YELLOW)Restart Claude Code completely$(NC)"
	@echo "  2. Run: $(BLUE)/mcp$(NC)"
	@echo "  3. Verify: $(GREEN)airis-mcp-gateway$(NC) appears in list"
	@echo ""
	@echo "$(BLUE)Access URLs:$(NC)"
	@echo "  Gateway:     http://localhost:9090"
	@echo "  Settings UI: http://localhost:5173"
	@echo "  API Docs:    http://localhost:8001/docs"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

.PHONY: uninstall-claude
uninstall-claude: ## Uninstall from Claude Code
	@echo "$(YELLOW)🗑️  Removing Claude Code configuration...$(NC)"
	@rm -f $(HOME)/.claude/mcp.json
	@echo "$(GREEN)✅ Configuration removed$(NC)"
	@$(MAKE) down
	@echo "$(GREEN)✅ Gateway stopped$(NC)"
	@echo ""
	@echo "$(GREEN)🎉 Uninstalled successfully$(NC)"

.PHONY: verify-claude
verify-claude: ## Verify Claude Code installation
	@echo "$(BLUE)🔍 Verifying installation...$(NC)"
	@echo ""
	@echo "Checking symlink..."
	@if [ -L $(HOME)/.claude/mcp.json ]; then \
		echo "$(GREEN)✅ Symlink exists: $(HOME)/.claude/mcp.json$(NC)"; \
		echo "   → $$(readlink $(HOME)/.claude/mcp.json)"; \
	else \
		echo "$(RED)❌ Symlink not found$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "Checking Gateway status..."
	@if docker inspect airis-mcp-gateway > /dev/null 2>&1; then \
		STATUS=$$(docker inspect --format '{{.State.Health.Status}}' airis-mcp-gateway 2>/dev/null || echo "no-healthcheck"); \
		if [ "$$STATUS" = "healthy" ]; then \
			echo "$(GREEN)✅ Gateway is healthy$(NC)"; \
		else \
			echo "$(YELLOW)⚠️  Gateway status: $$STATUS$(NC)"; \
		fi; \
	else \
		echo "$(RED)❌ Gateway not running$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "Checking connectivity..."
	@if curl -sf http://localhost:9090/ > /dev/null; then \
		echo "$(GREEN)✅ Gateway responding at http://localhost:9090$(NC)"; \
	else \
		echo "$(RED)❌ Gateway not responding$(NC)"; \
		exit 1; \
	fi
	@echo ""
	@echo "$(GREEN)🎉 All checks passed!$(NC)"
	@echo ""
	@echo "$(BLUE)Next: Restart Claude Code and run /mcp$(NC)"

# ========== Installation ==========

.PHONY: install
install: ## Install AIRIS Gateway to ALL editors (Claude Desktop, Cursor, Zed, etc.)
	@echo "$(BLUE)🌉 Installing AIRIS Gateway...$(NC)"
	@$(MAKE) up
	@echo "$(YELLOW)⏳ Waiting for Gateway to become healthy (max 60s)...$(NC)"
	@timeout 60 sh -c 'until docker inspect --format "{{.State.Health.Status}}" airis-mcp-gateway 2>/dev/null | grep -q "healthy"; do printf "."; sleep 1; done' || (echo "$(RED)❌ Gateway failed to become healthy$(NC)"; exit 1)
	@echo ""
	@echo "$(GREEN)✅ Gateway healthy$(NC)"
	@echo ""
	@python3 scripts/install_all_editors.py install
	@echo ""
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
	@echo "$(BLUE)Next Steps:$(NC)"
	@echo "  1. $(YELLOW)Restart ALL editors$(NC) (Claude Desktop, Cursor, Zed, etc.)"
	@echo "  2. Test MCP tools in any editor - all share same 25 servers!"
	@echo ""
	@echo "$(BLUE)Access URLs:$(NC)"
	@echo "  Gateway:     http://localhost:9090"
	@echo "  Settings UI: http://localhost:5173"
	@echo "  API Docs:    http://localhost:8001/docs"
	@echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

.PHONY: uninstall
uninstall: ## Uninstall AIRIS Gateway and restore original editor configs
	@echo "$(YELLOW)🗑️  Uninstalling AIRIS Gateway...$(NC)"
	@python3 scripts/install_all_editors.py uninstall
	@$(MAKE) down
	@echo ""
	@echo "$(GREEN)🎉 Uninstalled successfully$(NC)"
