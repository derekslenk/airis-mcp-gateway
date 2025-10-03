#!/bin/bash
# MCP Gateway Wrapper Script for Claude Desktop
# This script ensures docker-compose services are running and provides stdio interface

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Start docker-compose services if not already running
cd "$SCRIPT_DIR"
docker-compose ps | grep -q "Up" || docker-compose up -d >/dev/null 2>&1

# Wait for gateway to be ready
max_attempts=30
attempt=0
while ! curl -s http://localhost:8765/ >/dev/null 2>&1; do
    if [ $attempt -ge $max_attempts ]; then
        echo "Error: Gateway failed to start" >&2
        exit 1
    fi
    sleep 1
    attempt=$((attempt + 1))
done

# Create a stdio bridge to the HTTP gateway
node - << 'EOF'
const http = require('http');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Handle incoming JSON-RPC messages
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    
    // Forward to HTTP gateway
    const options = {
      hostname: 'localhost',
      port: 8765,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        // Send response back via stdout
        console.log(data);
      });
    });
    
    req.on('error', (error) => {
      console.error(JSON.stringify({
        jsonrpc: '2.0',
        id: message.id,
        error: {
          code: -32603,
          message: error.message
        }
      }));
    });
    
    req.write(JSON.stringify(message));
    req.end();
    
  } catch (error) {
    console.error(JSON.stringify({
      jsonrpc: '2.0',
      error: {
        code: -32700,
        message: 'Parse error'
      }
    }));
  }
});

// Initialize connection
console.log(JSON.stringify({
  jsonrpc: '2.0',
  method: 'initialized',
  params: {
    protocolVersion: '2024-11-05',
    capabilities: {
      tools: {},
      resources: {},
      prompts: {}
    },
    serverInfo: {
      name: 'docker-mcp-gateway',
      version: '1.0.0'
    }
  }
}));
EOF