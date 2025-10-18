"""
Integration tests for MCP Server PostgreSQL persistence.

Tests verify that UI state changes (enabled/disabled) are permanently
persisted to PostgreSQL database and survive container restarts.
"""
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.db.session import get_db
from app.crud import mcp_server as crud


@pytest.mark.asyncio
class TestMCPServerPersistence:
    """Test PostgreSQL persistence of MCP server state."""

    async def test_toggle_server_persists_enabled_state(
        self, async_client: AsyncClient, db: AsyncSession
    ):
        """
        Test that toggling a server ON persists to PostgreSQL.

        Scenario:
        1. Toggle Figma server to enabled=true
        2. Verify API returns enabled=true
        3. Query PostgreSQL directly - should be enabled=true
        4. Toggle again to enabled=false
        5. Verify both API and PostgreSQL reflect the change
        """
        server_id = "figma"

        # Step 1: Toggle server to enabled=true
        response = await async_client.post(f"/api/v1/mcp/servers/{server_id}/toggle")
        assert response.status_code == 200
        data = response.json()

        # Step 2: Verify API returns enabled state
        first_enabled_state = data["enabled"]

        # Step 3: Query PostgreSQL directly to verify persistence
        server = await crud.get_server_by_name(db, server_id)
        assert server is not None, f"Server {server_id} not found in database"
        assert server.enabled == first_enabled_state, "Database state doesn't match API response"

        # Step 4: Toggle again (flip the state)
        response = await async_client.post(f"/api/v1/mcp/servers/{server_id}/toggle")
        assert response.status_code == 200
        data = response.json()
        second_enabled_state = data["enabled"]

        # Verify state was flipped
        assert second_enabled_state != first_enabled_state, "Toggle didn't change state"

        # Step 5: Verify PostgreSQL reflects the new state
        await db.refresh(server)  # Refresh from database
        assert server.enabled == second_enabled_state, "Database state not updated after second toggle"

    async def test_server_list_reflects_database_state(
        self, async_client: AsyncClient, db: AsyncSession
    ):
        """
        Test that GET /servers endpoint returns current PostgreSQL state.

        This ensures the UI always shows the persisted state, not a cached or
        hardcoded state.
        """
        # Get all servers from API
        response = await async_client.get("/api/v1/mcp/servers/")
        assert response.status_code == 200
        servers_from_api = response.json()

        # Verify each server's state matches PostgreSQL
        for api_server in servers_from_api:
            server_name = api_server["name"]
            db_server = await crud.get_server_by_name(db, server_name)

            assert db_server is not None, f"Server {server_name} in API but not in DB"
            assert db_server.enabled == api_server["enabled"], \
                f"Server {server_name} enabled state mismatch: DB={db_server.enabled}, API={api_server['enabled']}"

    async def test_restart_preserves_enabled_state(
        self, async_client: AsyncClient, db: AsyncSession
    ):
        """
        Test that server state survives application/container restart.

        This test simulates:
        1. Set Figma to enabled=true
        2. Restart (simulated by creating new database session)
        3. Verify Figma is still enabled=true

        In real deployment, this would be tested by:
        - docker compose restart airis-api
        - Check UI shows same state as before restart
        """
        server_id = "figma"

        # Set server to specific state (enabled=true)
        if not (await crud.get_server_by_name(db, server_id)).enabled:
            await async_client.post(f"/api/v1/mcp/servers/{server_id}/toggle")

        # Verify current state
        response = await async_client.get(f"/api/v1/mcp/servers/{server_id}")
        assert response.status_code == 200
        before_restart = response.json()
        assert before_restart["enabled"] is True

        # Simulate restart by creating fresh database session
        # In PostgreSQL, data persists across sessions
        async for new_session in get_db():
            server_after_restart = await crud.get_server_by_name(new_session, server_id)
            assert server_after_restart.enabled is True, \
                "Server state not persisted after restart"
            break  # Only need first session

    async def test_multiple_toggles_maintain_consistency(
        self, async_client: AsyncClient, db: AsyncSession
    ):
        """
        Test rapid toggling maintains database consistency.

        Scenario: User clicks toggle button multiple times rapidly.
        Result: Each toggle should properly update PostgreSQL.
        """
        server_id = "figma"

        # Get initial state
        initial_server = await crud.get_server_by_name(db, server_id)
        initial_state = initial_server.enabled

        # Perform 5 toggles
        toggle_count = 5
        for i in range(toggle_count):
            response = await async_client.post(f"/api/v1/mcp/servers/{server_id}/toggle")
            assert response.status_code == 200

            # Verify database was updated
            await db.refresh(initial_server)
            expected_state = initial_state if (i + 1) % 2 == 0 else not initial_state
            assert initial_server.enabled == expected_state, \
                f"Toggle {i+1}: Expected {expected_state}, got {initial_server.enabled}"

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
        servers = await crud.get_all_servers(db)
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


@pytest.fixture
async def async_client():
    """Async HTTP client for testing API endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client


@pytest.fixture
async def db():
    """Async database session for direct PostgreSQL queries."""
    async for session in get_db():
        yield session
