# AIRIS MCP Gateway - Vision

**Maintained by**: Agiletec Inc.
**Created**: 2025-10-15

---

## 🎯 Mission Statement

**Solve the MCP token explosion problem and unify development experience across all editors.**

AIRIS MCP Gateway eliminates the fundamental inefficiency in MCP (Model Context Protocol) architecture where every tool definition is sent to IDEs at startup, causing:
- Performance degradation (12,500+ tokens for 25 servers)
- Configuration hell (different formats per editor)
- Wasted resources (unused tool definitions consuming capacity)

We believe developers deserve a **zero-token startup** experience with **unified configuration** that works everywhere.

---

## 🌍 Problem We're Solving

### Current State (Broken)
```
Developer Experience:
  IDE Startup → Load 25 MCP servers → 12,500 tokens sent → Slow/Unstable

Configuration Hell:
  Cursor   → mcp.json (format A)
  Windsurf → mcp.json (format B)
  Zed      → mcp.json (format C)
  VS Code  → settings.json (completely different)

  Result: Separate configs per editor = Maintenance nightmare

Resource Waste:
  - Tools you never use consume token budget
  - Each project restarts MCP servers → Memory/CPU waste
  - API keys scattered across multiple .env files → Security risk
```

### Future State (Our Vision)
```
Developer Experience:
  IDE Startup → Connect to Gateway → 0 tokens → Instant & Stable

Unified Configuration:
  Master mcp.json → Symlink to all editors → Update once, works everywhere

Resource Efficiency:
  - On-demand loading (only fetch what you use)
  - Gateway always running (no restart per project)
  - Centralized secrets (Docker secrets, no .env leaks)
```

---

## 🏢 Alignment with Agiletec Inc. Vision

AIRIS MCP Gateway is a concrete embodiment of Agiletec Inc.'s corporate philosophy: **"Eliminate the multi-layered subcontracting structure"** and **"Enable every company to develop in-house."**

### Corporate Mission: 多重請負構造を撲滅する

**Traditional MCP architecture creates structural dependencies that developers must accept.**

```
Traditional Structure (Dependency Chain):
  Developer
    ↓ Must accept
  Editor Vendor's inefficient design
    ↓ Forces
  Token explosion, configuration hell, resource waste
    ↓ Results in
  Developers lose control over their tools
```

**This is the "outsourcing dependency" in the development tools domain.**

Just as companies become dependent on multi-layered IT contractors, developers become dependent on inefficient tool architectures designed by vendors. They have no choice but to accept the waste.

**We eliminate this structure:**

```
AIRIS MCP Gateway (Developer Control):
  Developer
    ↓ Controls
  Gateway (Open source, self-hosted)
    ↓ Optimizes
  Zero-token startup, unified config, containerized servers
    ↓ Results in
  Developers regain control over their environment
```

**Key eliminations**:
- ❌ **Token explosion** → Forcing developers to waste time waiting
- ❌ **Editor configuration hell** → Vendor-specific fragmentation
- ❌ **Host environment pollution** → Dependency management chaos

**All eliminated. Developers control their tools.**

### Corporate Vision: すべての企業に自社開発

**Development tool efficiency is the foundation of in-house development capability.**

Companies that cannot develop in-house often cite these reasons:
- "Development is too complex"
- "Setting up the environment takes too long"
- "Managing dependencies is a nightmare"
- "It's easier to outsource"

**These are not excuses—they are real structural problems.**

AIRIS MCP Gateway addresses the root cause:

1. **Complexity → Simplicity**
   - One command install (`make install`)
   - Works across all editors immediately
   - No manual configuration required

2. **Environment setup → Instant**
   - Zero-token startup (<1 second)
   - Docker containerization (no host pollution)
   - Unified configuration (update once, works everywhere)

3. **Dependency hell → Clean isolation**
   - All servers run in Docker containers
   - No `npx`, `uvx`, or global installations
   - Clean machine, consistent environment

**Result**: Developers can focus on creating value, not fighting tools.

### From Tool Optimization to Business Transformation

**Fixing development tools is not just about productivity—it's about enabling self-development.**

```
Inefficient Tools
  → Developers waste time
  → Companies think "development is too complex"
  → Outsourcing becomes the default
  → Dependency on external vendors increases
  → "In-house development capability" disappears

Efficient Tools (AIRIS MCP Gateway)
  → Developers work efficiently
  → Companies see "development is manageable"
  → In-house development becomes feasible
  → Self-sufficiency increases
  → "In-house development capability" grows
```

**AIRIS MCP Gateway is the first step toward reclaiming development power.**

By solving token explosion, configuration hell, and environment pollution, we remove the barriers that make companies think "we can't develop in-house."

---

## 💡 Core Philosophy

### 1. Zero-Token Principle
**"No tool definition should be sent until explicitly requested."**

Traditional MCP: Send everything upfront → Waste
OpenMCP Pattern: Send metadata only → Load details on-demand

### 2. Build Once, Use Everywhere
**"One configuration file should work across all editors and projects."**

No more maintaining separate configs for Cursor, Windsurf, Zed, VS Code.
Master `mcp.json` → Symlink → Universal compatibility.

### 3. Zero Host Pollution
**"Development tools should not pollute the developer's machine."**

All MCP servers run in Docker containers.
No `npx`, `uvx`, or global installations required.
Clean machine, consistent environment.

### 4. Security by Default
**"Secrets should never touch the filesystem."**

Docker secrets integration (encrypted, runtime-only).
No `.env` files → Zero Git leak risk.

---

## 🚀 Strategic Value

### For Individual Developers
- **Speed**: Zero-token startup = instant IDE readiness
- **Simplicity**: One command install = works everywhere
- **Safety**: Docker secrets = no credential leaks

### For Teams
- **Consistency**: Same toolset across all developers
- **Maintainability**: Update once, applies to everyone
- **Onboarding**: New developers productive in minutes

### For Open Source Community
- **MIT License**: Free to use and modify
- **Extensible**: Add custom MCP servers easily
- **Educational**: Reference implementation of OpenMCP pattern

---

## 🎓 Technical Innovation

### OpenMCP Lazy Loading Pattern
We implement the **Schema Partitioning** technique inspired by OpenMCP:

**Traditional MCP** (Full Schema):
```json
{
  "tools": [
    {
      "name": "stripe_create_payment",
      "inputSchema": {
        "properties": {
          "amount": {"type": "number"},
          "metadata": {
            "properties": {
              "shipping": {
                "properties": {
                  "address": {...}  // Deep nesting
                }
              }
            }
          }
        }
      }
    }
  ]
}
```
**Result**: 1000 tokens per tool × 25 tools = 25,000 tokens

**OpenMCP Pattern** (Partitioned Schema):
```json
{
  "tools": [
    {
      "name": "stripe_create_payment",
      "inputSchema": {
        "properties": {
          "amount": {"type": "number"},
          "metadata": {"type": "object"}  // Top-level only
        }
      }
    },
    {
      "name": "expandSchema",
      "description": "Get detailed schema on-demand"
    }
  ]
}
```
**Result**: 50 tokens per tool × 25 tools = 1,250 tokens (**90% reduction**)

When developer needs details:
```
Claude → expandSchema(toolName="stripe_create_payment", path=["metadata", "shipping"])
       → Returns detailed schema only for that property
```

---

## 🌟 Long-Term Vision

### Phase 1: MVP (Current)
**Goal**: Prove 75-90% token reduction is achievable
**Target**: Individual developers adopting Gateway

### Phase 2: Stabilization (2025 Q2)
**Goal**: Production-ready reliability
**Target**: Small teams standardizing on Gateway

### Phase 3: Universal Adoption (2025 Q3)
**Goal**: All major editors supported (Cursor, Windsurf, Zed, VS Code)
**Target**: Recommended by editor vendors

### Phase 4: Ecosystem (2025 Q4)
**Goal**: Gateway becomes MCP server marketplace
**Target**: Community-contributed servers, plugin ecosystem

---

## 🧭 Guiding Principles

1. **User First**: Developer experience over implementation complexity
2. **Simplicity**: One command install, zero configuration
3. **Performance**: Sub-second IDE startup, always
4. **Security**: No secrets on disk, ever
5. **Openness**: MIT license, community-driven development
6. **Quality**: Production-ready code, comprehensive testing
7. **Documentation**: Clear guides for users and contributors

---

## 📐 Success Metrics

### Technical Goals
- ✅ Token reduction: 75-90%
- ✅ Startup time: <1 second
- ✅ Zero host dependencies (Docker-only)
- ✅ Multi-editor support (4+ editors)

### Adoption Goals
- Phase 1: 100 developers (MVP validation)
- Phase 2: 1,000 developers (community traction)
- Phase 3: 10,000 developers (industry standard)

### Community Goals
- 50+ contributors
- 100+ custom MCP servers
- Documentation in 5+ languages

---

## 💬 Why This Matters

**Current MCP architecture is fundamentally inefficient.**

Sending all tool definitions upfront is like loading an entire library into memory before opening a single book. It's wasteful, slow, and doesn't scale.

**We're fixing this at the protocol level.**

OpenMCP Lazy Loading is not a hack—it's how MCP should have worked from the beginning. By proving this pattern works in production, we're establishing a new standard for the entire MCP ecosystem.

**This is bigger than one tool.**

AIRIS MCP Gateway is the reference implementation, but the real mission is changing how developers interact with AI tools. We're building the infrastructure for the next generation of AI-powered development environments.

---

## 🔗 Related Documents

### Corporate Level
- [Agiletec Inc. VISION.md](../agiletec/VISION.md) - Corporate philosophy and mission

### Product Level
- [ROADMAP.md](./ROADMAP.md) - Development phases and timeline
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical design and implementation
- [TASK_LIST.md](./TASK_LIST.md) - Current development status
- [README.md](./README.md) - Installation and usage guide

---

**"Build once. Use everywhere. Zero waste."**

— Agiletec Inc.
