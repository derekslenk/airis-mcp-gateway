from fastapi import APIRouter
from .endpoints import mcp_servers_router
from .endpoints.secrets import router as secrets_router
# from .endpoints.mcp_proxy import router as mcp_proxy_router  # Disabled: Use Port 9090 directly

api_router = APIRouter()

api_router.include_router(
    mcp_servers_router,
    prefix="/mcp/servers",
    tags=["MCP Servers"]
)

api_router.include_router(
    secrets_router,
    prefix="/secrets",
    tags=["Secrets"]
)

# MCP Proxy Layer Removed - Connect directly to Port 9090
# Reason: Unnecessary proxy layer, 9090 works correctly
# To re-enable: uncomment import and router below
# api_router.include_router(
#     mcp_proxy_router,
#     prefix="/mcp",
#     tags=["MCP Proxy"]
# )
