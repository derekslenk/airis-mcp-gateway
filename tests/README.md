# Test Suite

This directory contains comprehensive tests for the AIRIS MCP Gateway project.

## Directory Structure

The test structure mirrors the project structure:

```
tests/
├── conftest.py                           # Pytest configuration and fixtures
├── apps/
│   ├── api/
│   │   └── app/
│   │       └── api/
│   │           └── endpoints/
│   │               └── test_validate_server.py  # Validation endpoint tests
│   └── settings/
│       └── src/
│           ├── validation/
│           │   └── test_server_config.py        # Zod schema validation tests
│           └── pages/
│               └── mcp-dashboard/
│                   └── components/
│                       └── test_MultiFieldConfigModal.py  # Component tests
└── integration/
    └── test_server_toggle_workflow.py    # End-to-end integration tests
```

## Running Tests

### All Tests
```bash
pytest tests/
```

### Specific Test File
```bash
pytest tests/apps/api/app/api/endpoints/test_validate_server.py
```

### With Coverage
```bash
pytest tests/ --cov=apps --cov-report=html
```

### Verbose Output
```bash
pytest tests/ -v
```

## Test Categories

### Unit Tests
- **Validation Endpoint Tests**: `test_validate_server.py`
  - Tests for all 7 server validators (Supabase, Stripe, GitHub, Slack, Twilio, Notion, Sentry)
  - Network error handling
  - Missing configuration key handling

- **Zod Schema Tests**: `test_server_config.py`
  - Schema validation for all 12 servers
  - Field-level validation
  - Error message validation

### Component Tests
- **MultiFieldConfigModal**: Tests for the multi-field configuration modal component
  - Form validation
  - User input handling
  - Error display

### Integration Tests
- **Server Toggle Workflow**: End-to-end tests for enabling/disabling servers
  - Toggle validation
  - API key requirement checks
  - Database persistence

## Test Fixtures

Defined in `conftest.py`:
- `sample_mcp_config`: Sample server configuration
- `valid_tavily_config`: Valid Tavily API key
- `valid_supabase_config`: Valid Supabase URL + Anon Key
- `valid_twilio_config`: Valid Twilio Account SID + API Key + Secret
- `invalid_tavily_config`: Invalid API key for negative testing

## Requirements

Install test dependencies:
```bash
pip install pytest pytest-asyncio pytest-cov httpx
```

## CI/CD Integration

Tests should run automatically on:
- Pull requests
- Pre-commit hooks
- CI/CD pipeline

Exit code 0 = all tests passed
Exit code 1 = test failures detected
