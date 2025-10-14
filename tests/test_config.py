"""
Configuration validation tests (fast, Docker-compatible)
"""
import json
from pathlib import Path


def test_mcp_config_exists():
    """Test mcp-config.json exists"""
    config_path = Path("/workspace/mcp-config.json")
    assert config_path.exists(), "mcp-config.json not found"


def test_mcp_config_valid_json():
    """Test mcp-config.json is valid JSON"""
    config_path = Path("/workspace/mcp-config.json")

    with open(config_path) as f:
        config = json.load(f)

    assert isinstance(config, dict), "Config must be a dictionary"


def test_mcp_config_has_servers():
    """Test mcpServers key exists"""
    config_path = Path("/workspace/mcp-config.json")

    with open(config_path) as f:
        config = json.load(f)

    assert "mcpServers" in config, "mcpServers key not found"
    assert isinstance(config["mcpServers"], dict), "mcpServers must be a dictionary"


def test_active_servers_configured():
    """Test at least one active server is configured"""
    config_path = Path("/workspace/mcp-config.json")

    with open(config_path) as f:
        config = json.load(f)

    servers = config.get("mcpServers", {})
    active_servers = [name for name in servers.keys() if not name.startswith("__")]

    assert len(active_servers) > 0, "No active MCP servers configured"

    # Report active servers
    print(f"\n✅ Active servers ({len(active_servers)}): {', '.join(sorted(active_servers))}")


def test_gateway_mcp_json_exists():
    """Test mcp.json (client config) exists"""
    mcp_json = Path("/workspace/mcp.json")
    assert mcp_json.exists(), "mcp.json not found"


def test_gateway_mcp_json_valid():
    """Test mcp.json has Gateway configuration"""
    mcp_json = Path("/workspace/mcp.json")

    with open(mcp_json) as f:
        config = json.load(f)

    assert "mcpServers" in config, "mcpServers not in mcp.json"

    servers = config["mcpServers"]
    assert "docker-mcp-gateway" in servers, "docker-mcp-gateway not configured"

    gateway_cfg = servers["docker-mcp-gateway"]
    assert "url" in gateway_cfg, "Gateway URL not configured"
    assert gateway_cfg["url"] == "http://localhost:9090/sse", f"Unexpected Gateway URL: {gateway_cfg['url']}"

    print(f"\n✅ Gateway URL: {gateway_cfg['url']}")
