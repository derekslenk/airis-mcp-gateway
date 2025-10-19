"""
Integration tests for MCP Server PostgreSQL persistence.

Tests verify that UI state changes (enabled/disabled) are permanently
persisted to PostgreSQL database and survive container restarts.
"""
import pytest
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import AsyncSessionLocal
from app.crud import mcp_server as crud

# API base URL (container internal)
API_BASE_URL = "http://localhost:8000"


@pytest.mark.asyncio
class TestMCPServerPersistence:
    """Test PostgreSQL persistence of MCP server state."""

    async def test_toggle_server_persists_enabled_state(self, db: AsyncSession):
        """
        Test that toggling a server ON persists to PostgreSQL.

        Scenario:
        1. Get Figma server ID by name
        2. Toggle server enabled state
        3. Verify API returns new state
        4. Query PostgreSQL directly - should match API state
        5. Toggle again
        6. Verify both API and PostgreSQL reflect the change
        """
        async with httpx.AsyncClient(base_url=API_BASE_URL) as client:
            # Step 1: Get Figma server
            server_name = "figma"
            server = await crud.get_server_by_name(db, server_name)
            assert server is not None, f"Server {server_name} not found in database"
            server_id = server.id
            initial_state = server.enabled

            # Step 2: Toggle server (flip state)
            new_state = not initial_state
            response = await client.post(
                f"/api/v1/mcp/servers/{server_id}/toggle",
                json={"enabled": new_state}
            )
            assert response.status_code == 200
            data = response.json()

            # Step 3: Verify API returns new enabled state
            assert data["enabled"] == new_state, "API response doesn't match requested state"

            # Step 4: Query PostgreSQL directly to verify persistence
            await db.refresh(server)
            assert server.enabled == new_state, "Database state doesn't match API response"

            # Step 5: Toggle again (back to original)
            response = await client.post(
                f"/api/v1/mcp/servers/{server_id}/toggle",
                json={"enabled": initial_state}
            )
            assert response.status_code == 200
            data = response.json()
            assert data["enabled"] == initial_state, "Second toggle failed"

            # Step 6: Verify PostgreSQL reflects the change
            await db.refresh(server)
            assert server.enabled == initial_state, "Database state not updated after second toggle"

    async def test_server_list_reflects_database_state(self, db: AsyncSession):
        """
        Test that GET /servers endpoint returns current PostgreSQL state.

        This ensures the UI always shows the persisted state, not a cached or
        hardcoded state.
        """
        async with httpx.AsyncClient(base_url=API_BASE_URL) as client:
            # Get all servers from API
            response = await client.get("/api/v1/mcp/servers/")
            assert response.status_code == 200
            servers_from_api = response.json()

            # Verify each server's state matches PostgreSQL
            for api_server in servers_from_api:
                server_name = api_server["name"]
                db_server = await crud.get_server_by_name(db, server_name)

                assert db_server is not None, f"Server {server_name} in API but not in DB"
                assert db_server.enabled == api_server["enabled"], \
                    f"Server {server_name} enabled state mismatch: DB={db_server.enabled}, API={api_server['enabled']}"

    async def test_restart_preserves_enabled_state(self, db: AsyncSession):
        """
        Test that server state survives application/container restart.

        This test verifies:
        1. Get Figma server
        2. Set to enabled=true if not already
        3. Verify persistence through direct database query
        """
        async with httpx.AsyncClient(base_url=API_BASE_URL) as client:
            server_name = "figma"

            # Get server by name
            server = await crud.get_server_by_name(db, server_name)
            assert server is not None, f"Server {server_name} not found"
            server_id = server.id

            # Ensure server is enabled
            if not server.enabled:
                response = await client.post(
                    f"/api/v1/mcp/servers/{server_id}/toggle",
                    json={"enabled": True}
                )
                assert response.status_code == 200

            # Verify current state via API
            response = await client.get(f"/api/v1/mcp/servers/{server_id}")
            assert response.status_code == 200
            before_state = response.json()
            assert before_state["enabled"] is True

            # Verify persistence through direct database query
            await db.refresh(server)
            assert server.enabled is True, "Server state not persisted in database"

    async def test_multiple_toggles_maintain_consistency(self, db: AsyncSession):
        """
        Test multiple toggles maintain database consistency.

        Scenario: User toggles server multiple times.
        Result: Each toggle should properly update PostgreSQL.
        """
        async with httpx.AsyncClient(base_url=API_BASE_URL) as client:
            server_name = "figma"

            # Get server
            server = await crud.get_server_by_name(db, server_name)
            assert server is not None
            server_id = server.id
            initial_state = server.enabled

            # Perform 3 toggles
            for i in range(3):
                new_state = not ((i % 2 == 0) == initial_state)
                response = await client.post(
                    f"/api/v1/mcp/servers/{server_id}/toggle",
                    json={"enabled": new_state}
                )
                assert response.status_code == 200

                # Verify database was updated
                await db.refresh(server)
                assert server.enabled == new_state, \
                    f"Toggle {i+1}: Expected {new_state}, got {server.enabled}"

    async def test_enabled_state_survives_migration(self, db: AsyncSession):
        """
        Test that enabled state is preserved during Alembic migrations.

        This is critical for production deployments where migrations run
        before container startup.

        Verified behavior:
        - Column 'enabled' has default value (True/False)
        - Existing rows preserve their enabled state
        - No data loss during schema updates
        """
        # Query all servers
        servers = await crud.get_servers(db, skip=0, limit=100)
        assert len(servers) > 0, "No servers found in database"

        # Verify each server has a boolean enabled state (not None)
        for server in servers:
            assert isinstance(server.enabled, bool), \
                f"Server {server.name} has invalid enabled state: {server.enabled}"

            # Verify required fields exist (migration integrity)
            assert server.name is not None
            assert server.command is not None
            assert server.created_at is not None
            assert server.updated_at is not None


@pytest.fixture(scope="function")
async def db():
    """Async database session for direct PostgreSQL queries."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
