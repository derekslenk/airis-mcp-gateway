# Secrets Management

## Setup

Store secrets using Docker MCP secret store:

```bash
# Stripe
docker mcp secret set STRIPE_API_KEY=sk_test_...

# Twilio
docker mcp secret set TWILIO_ACCOUNT_SID=AC...
docker mcp secret set TWILIO_API_KEY=SK...
docker mcp secret set TWILIO_API_SECRET=...
```

## List Secrets

```bash
docker mcp secret ls
```

## Remove Secrets

```bash
docker mcp secret rm STRIPE_API_KEY
```

## How It Works

- Secrets stored in encrypted Docker Desktop secret store
- Injected at runtime via `x-secret` labels in docker-compose.yml
- Available as files in `/run/secrets/` inside containers
- Never stored in plaintext files or Git

## Security Benefits

1. **Encrypted at rest**: Docker Desktop manages encryption
2. **No Git exposure**: Secrets never in repository
3. **Runtime injection**: Only available when containers run
4. **OrbStack compatible**: Works seamlessly with OrbStack
