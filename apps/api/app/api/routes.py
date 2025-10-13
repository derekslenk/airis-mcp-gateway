from fastapi import APIRouter
from .endpoints import mcp_servers_router

api_router = APIRouter()

api_router.include_router(
    mcp_servers_router,
    prefix="/mcp/servers",
    tags=["MCP Servers"]
)
