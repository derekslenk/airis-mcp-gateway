from pydantic_settings import BaseSettings
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@postgres:5432/mcp_gateway"

    # MCP Gateway
    MCP_CONFIG_PATH: Path = Path("/workspace/github/airis-mcp-gateway/mcp-config.json")

    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "AIRIS MCP Gateway API"
    DEBUG: bool = True

    # CORS
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://settings.airis.traefik",
    ]

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
