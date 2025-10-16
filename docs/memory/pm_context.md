# PM Agent Context - AIRIS MCP Gateway

**Project**: AIRIS MCP Gateway
**Repository**: /Users/kazuki/github/airis-mcp-gateway
**Last Updated**: 2025-10-17 02:37 JST

---

## 📊 Project Overview

**Mission**: Solve the MCP token explosion problem through OpenMCP Lazy Loading pattern

**Tech Stack**:
- **Proxy**: FastAPI (Python 3.11+) @ port 8001
- **Gateway**: MCP Official (Docker) @ port 9090
- **Database**: PostgreSQL @ port 5432
- **Settings UI**: Vite + React + TypeScript @ port 5173
- **MCP Servers**: 25+ servers (Docker containers)
- **Containerization**: Docker Compose (zero host pollution)

**Architecture Pattern**: OpenMCP Schema Partitioning
- Zero-token startup (~1,250 tokens, 90% reduction from 12,500)
- On-demand schema expansion via `expandSchema` tool
- Transparent SSE proxy with in-memory caching

---

## 🎯 Current Phase

**Phase 2: Stabilization & Validation** (20% complete)
- **Timeline**: 2025-10-15 ~ 2025-10-31
- **Status**: Real-world testing in progress
- **Next Milestone**: Milestone 2.1 (Real-World Testing) - Target: 2025-10-21

**Recent Commits**:
- d01c1b0: chore: remove node_modules from Git and enforce Docker-only development
- 189e544: chore: exclude node_modules from version control
- ce4e5f4: feat: add profile system and self-management server with token optimization

---

## 📈 Progress Status

**Phase 1 (MVP)**: ✅ Complete (100%)
- Schema Partitioning implementation
- MCP Proxy with SSE streaming
- expandSchema tool for on-demand fetching
- Token reduction test script
- One-command installation
- Docker containerization

**Phase 2 (Stabilization)**: 🚧 20% complete
- [ ] Real-World Testing (Milestone 2.1)
- [ ] Error Handling & Robustness (Milestone 2.2)
- [ ] Multi-Editor Support (Milestone 2.3)

---

## 🔍 Codebase Characteristics

- **File Count**: ~2,908 source files (including node_modules)
- **Core Source**: Python (apps/api), TypeScript (apps/settings, servers/mindbase)
- **TODO/FIXME**: 50 files with markers (primarily in pnpm-lock and package-lock files)
- **Test Coverage**: TBD (test_token_reduction.py exists)
- **Documentation**: Comprehensive (ARCHITECTURE.md, VISION.md, ROADMAP.md)

---

## 🚧 Known Technical Debt

From git status:
- Deleted files pending commit: apps/settings/Dockerfile, src/lib/api.ts, src/lib/serverConfig.ts
- Modified files: Settings UI components (ConfigEditor, MCPServerCard, StatusIndicator, page.tsx)
- New file: TipsModal.tsx (not tracked)
- Strategy: Docker-only development enforcement in progress

---

## 🎓 Key Architectural Decisions

1. **Schema Partitioning Depth**: Top-level only (depth=1)
   - Rationale: 90-95% token reduction for deeply nested schemas
   - Trade-off: Requires expandSchema calls for nested properties

2. **Proxy Layer**: FastAPI instead of native Node.js
   - Rationale: Python ecosystem alignment, async HTTP/SSE support
   - Trade-off: Additional language dependency

3. **Zero Host Pollution**: All MCP servers in Docker
   - Rationale: Clean developer machine, consistent environment
   - Trade-off: Docker overhead, initial setup complexity

---

## 🔗 Related Projects (Workspace Context)

This is part of Kazuki's workspace at `/Users/kazuki/github/`:
- **agiletec**: AI phone services (Next.js 15 + Supabase)
- **mkk**: Tank design (FastAPI + Ollama LLM)
- **ec-cloud-app**: E-commerce (Saleor + Next.js)
- **airis-mcp-gateway**: This project (MCP optimization)

**Infrastructure**: Shared Traefik reverse proxy, OrbStack Docker environment

---

## 📝 Next Actions

Based on ROADMAP.md Phase 2 priorities:

1. **Milestone 2.1: Real-World Testing** (Week 1)
   - Execute functional validation (make up, test_token_reduction.py)
   - Measure actual token usage (not just estimates)
   - Load test with multiple concurrent connections
   - Verify Docker Compose integration

2. **Milestone 2.2: Error Handling** (Week 2)
   - Implement retry logic with exponential backoff
   - Add graceful degradation (fallback to full schemas)
   - Structured logging (INFO/WARNING/ERROR)
   - Connection health monitoring

3. **Milestone 2.3: Multi-Editor Support** (Week 2)
   - Auto-detect installed editors (Cursor, Windsurf, Zed)
   - Test mcp.json compatibility across editors
   - Universal installation script

---

## 🧭 Strategic Context

**Corporate Alignment** (Agiletec Inc.):
- Mission: Eliminate multi-layered outsourcing structure
- Vision: Enable every company to develop in-house
- AIRIS contribution: Removes tool inefficiency barriers to in-house development

**Long-Term Goals**:
- Phase 3: Performance optimization (Redis caching, HTTP/2)
- Phase 4: Ecosystem & marketplace (10K+ developers)
- Industry impact: Establish OpenMCP pattern as standard

---

**Last Session**: None (first session)
**Session Count**: 1
