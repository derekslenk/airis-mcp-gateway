# Tech Stack Details

## Core Technologies

### Docker Infrastructure
- **Docker Compose**: Multi-container orchestration
- **Gateway Image**: docker/mcp-gateway:latest
- **Volumes**: claude-memory (persistent storage)
- **Networks**: Default bridge network
- **Secrets**: Docker secrets for API keys (stripe, twilio, figma)
- **Health Checks**: Gateway and Settings UI health monitoring

### Frontend Stack (Settings UI)

#### Core Framework
- React 19.1.0 (latest with React 19 features)
- React DOM 19.1.0
- TypeScript 5.8.3

#### Build & Development
- Vite 7.0.3 (build tool)
- @vitejs/plugin-react-swc 3.10.2 (SWC compilation)
- unplugin-auto-import 19.3.0 (auto imports)

#### Styling
- Tailwind CSS 3.4.17
- PostCSS 8.5.6
- Autoprefixer 10.4.21

#### Routing & i18n
- React Router DOM 7.6.3
- i18next 25.3.2
- react-i18next 15.6.0
- i18next-browser-languagedetector 8.2.0

#### Backend Services
- Firebase 12.0.0 (authentication, database)
- Supabase JS 2.57.4 (database, auth)
- Stripe React 4.0.2 (payments)

#### Data Visualization
- Recharts 3.2.0 (charts and graphs)

#### Linting & Code Quality
- ESLint 9.30.1
- @eslint/js 9.30.1
- typescript-eslint 8.35.1
- eslint-plugin-react-hooks 5.2.0
- eslint-plugin-react-refresh 0.4.20

### MCP Servers

#### Built-in (Gateway Image)
- time: Current time/date operations
- fetch: Web content fetching
- git: Git repository operations
- memory: Persistent knowledge storage
- sequentialthinking: Complex problem-solving

#### Gateway NPX (Docker-contained)
- filesystem: File operations with access controls
- serena: Symbol search (Python/Go) with LSP integration
- puppeteer: Browser automation and web scraping
- sqlite: SQLite database operations

#### API Integrations (Disabled by default)
- brave-search: Web/news/image/video search
- github: GitHub repository operations
- mcp-postgres-server: PostgreSQL operations
- stripe: Payment APIs
- twilio: Phone/SMS APIs
- figma: Figma design file access
- slack: Slack workspace integration
- sentry: Error monitoring and debugging

#### Editor-side (npx)
- context7: Library documentation search (Docker version has bugs)

## Development Tools
- npm/npx: Package management (inside Docker)
- uvx: Python tool runner (for serena)
- Make: Build automation
- Git: Version control