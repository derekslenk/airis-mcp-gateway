# Codebase Structure

## Project Root

```
airis-mcp-gateway/
├── .serena/                     # Serena MCP configuration (auto-generated)
├── .claude/                     # Claude-specific config (if any)
├── apps/                        # Application code
│   └── settings/                # React Settings UI frontend
├── docker-compose.yml           # Main service definitions
├── docker-compose.override.yml  # Traefik routing overrides
├── mcp-config.json             # Gateway internal MCP server config
├── mcp.json                    # Client-side editor config
├── figma-catalog.yaml          # Figma MCP configuration
├── Makefile                    # Build automation commands
├── .gitignore                  # Git ignore patterns
├── LICENSE                     # MIT License
├── SECRETS.md                  # API key management documentation
├── README.md                   # English project documentation
└── README.ja.md                # Japanese project documentation
```

## apps/settings/ (React Frontend)

```
apps/settings/
├── src/                        # Source code
│   ├── components/             # React components (assumed)
│   ├── pages/                  # React Router pages (assumed)
│   ├── hooks/                  # Custom React hooks (assumed)
│   ├── utils/                  # Utility functions (assumed)
│   ├── types/                  # TypeScript type definitions (assumed)
│   ├── i18n/                   # i18next translations (assumed)
│   ├── main.tsx                # Application entry point (assumed)
│   └── App.tsx                 # Root component (assumed)
├── public/                     # Static assets (assumed)
├── Dockerfile                  # Multi-stage build for production
├── package.json                # npm dependencies and scripts
├── vite.config.ts              # Vite build configuration
├── tsconfig.json               # Base TypeScript config
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Node/Vite TypeScript config
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.ts           # PostCSS configuration
└── index.html                  # HTML entry point
```

## Configuration Files

### Docker Configuration
- **docker-compose.yml**: Defines two services:
  - `mcp-gateway`: Docker MCP Gateway (port 9090)
  - `settings-ui`: React frontend (port 5173→80)
- **docker-compose.override.yml**: Traefik routing labels (settings.airis.traefik)
- **Volumes**: `claude-memory` (persistent MCP memory)
- **Mounts**: `/Users/kazuki/github:/workspace/github:rw` (host code access)

### MCP Configuration
- **mcp-config.json**: Gateway internal configuration
  - `mcpGateway`: Gateway metadata and settings
  - `mcpServers`: Server definitions (command, args, env)
  - Built-in servers: time, fetch, git, memory, sequentialthinking
  - Gateway NPX servers: filesystem, serena, puppeteer, sqlite
  - Disabled API servers: brave-search, github, postgres, stripe, twilio, figma, slack, sentry
  - Naming convention: `__disabled_` prefix for inactive servers
  - Comments: `__comment_` prefix for documentation
  
- **mcp.json**: Client-side editor configuration
  - `docker-mcp-gateway`: Gateway URL (http://localhost:9090/sse)
  - `context7`: Editor-side npx server (Docker version has bugs)

### Frontend Configuration
- **vite.config.ts**: Vite build and dev server settings
- **tsconfig.json**: Base TypeScript configuration
- **tsconfig.app.json**: Application TypeScript settings
- **tsconfig.node.json**: Vite/Node TypeScript settings
- **tailwind.config.ts**: Tailwind CSS customization
- **postcss.config.ts**: PostCSS plugins and processing

### Build Automation
- **Makefile**: Standard commands (up, down, restart, logs, ps, clean, info)
  - Special: ui-build, ui-up, ui-down, ui-logs, ui-shell

## Key Directories (Gitignored)

```
.gitignore exclusions:
- *.log, *.tmp              # Temporary and log files
- .env, .env.*              # Environment variables (except .env.example)
- .DS_Store                 # macOS system files
- data/                     # Docker persistent data
- logs/                     # Application logs
- context7/                 # Context7 MCP cache
- claude-memory/            # MCP memory storage
- original-repos/           # Nested git repositories
```

## Service Architecture

### Gateway Service (docker-mcp-gateway)
```
Container: docker-mcp-gateway
Image: docker/mcp-gateway:latest
Entrypoint: /docker-mcp
Command: gateway run --transport=sse --port=9090 --config=/etc/docker-mcp/config.json
Ports: 9090:9090
Volumes:
  - /var/run/docker.sock:/var/run/docker.sock (Docker access)
  - /Users/kazuki/github:/workspace/github:rw (host code)
  - claude-memory:/app/memory (persistent storage)
  - ./mcp-config.json:/etc/docker-mcp/config.json:ro (config)
  - ./figma-catalog.yaml:/etc/docker-mcp/figma-catalog.yaml:ro (figma config)
Health: http://localhost:9090/ (30s interval, 40s start period)
```

### Settings UI Service (airis-settings-ui)
```
Container: airis-settings-ui
Build: ./apps/settings/Dockerfile
Ports: 5173:80
Depends: mcp-gateway
Health: http://localhost:80/ (30s interval, 10s start period)
Access:
  - Port: http://localhost:5173
  - Traefik: http://settings.airis.traefik (via override)
```

## MCP Server Classification

### Built-in Servers (Gateway Image)
- **time**: Date/time operations
- **fetch**: Web content retrieval
- **git**: Git repository operations
- **memory**: Persistent storage
- **sequentialthinking**: Complex reasoning

### Gateway NPX Servers (Docker-contained)
- **filesystem**: File operations with access controls
- **serena**: Symbol search with LSP (Python/Go)
- **puppeteer**: Browser automation
- **sqlite**: SQLite database operations

### API Integration Servers (Disabled)
- **brave-search**: Web search (BRAVE_API_KEY)
- **github**: GitHub API (GITHUB_PERSONAL_ACCESS_TOKEN)
- **mcp-postgres-server**: PostgreSQL (POSTGRES_CONNECTION_STRING)
- **stripe**: Payments (STRIPE_SECRET_KEY via Docker secrets)
- **twilio**: Phone/SMS (TWILIO_ACCOUNT_SID, API_KEY, API_SECRET via secrets)
- **figma**: Design files (FIGMA_ACCESS_TOKEN via secrets)
- **slack**: Workspace integration (SLACK_BOT_TOKEN, SLACK_TEAM_ID)
- **sentry**: Error monitoring (SENTRY_AUTH_TOKEN, SENTRY_ORG)

### Editor-side Servers (npx outside Gateway)
- **context7**: Library documentation search (Docker version buggy)

## File Relationships

### Configuration Chain
1. `docker-compose.yml` → defines services
2. `docker-compose.override.yml` → adds Traefik routing
3. `mcp-config.json` → mounted into Gateway container
4. `mcp.json` → symlinked to editor config locations

### Frontend Build Chain
1. `package.json` → dependencies
2. `vite.config.ts` → build configuration
3. `tsconfig.*.json` → TypeScript compilation
4. `tailwind.config.ts` → styling
5. `Dockerfile` → production container image