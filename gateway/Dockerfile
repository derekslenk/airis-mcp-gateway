# AIRIS MCP Gateway - Unified MCP Server Routing Layer
# Based on docker/mcp-gateway with AIRIS branding

FROM docker/mcp-gateway:latest

LABEL maintainer="AIRIS MCP Gateway Team"
LABEL description="AIRIS MCP Gateway - Centralized MCP Server routing with 11+ integrated servers"
LABEL version="1.0.0"

# AIRIS-specific environment variables
ENV AIRIS_VERSION="1.0.0"
ENV AIRIS_MCP_GATEWAY="true"

# Health check for AIRIS Gateway
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=40s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:9090/ || exit 1

# Default entrypoint (inherited from base image)
# ENTRYPOINT ["/docker-mcp", "gateway", "run"]
