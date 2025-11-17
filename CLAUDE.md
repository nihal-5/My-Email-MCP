# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**agentkit** is a local-first WhatsApp MCP (Model Context Protocol) server that enables AI agents to interact with WhatsApp Web. It exposes WhatsApp functionality through a simple HTTP/JSON-RPC interface.

**Key Characteristics:**
- Personal use only, runs locally
- Session-based authentication (QR code on first run)
- No external cloud dependencies
- TypeScript/Node.js with ES modules

## Development Commands

```bash
# Install dependencies
npm install

# Run in development mode (auto-reload)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## Architecture

### Core Components

1. **WhatsAppClient** (`src/whatsapp-client.ts`)
   - Wraps `whatsapp-web.js` library
   - Handles authentication and session persistence
   - Provides typed methods for WhatsApp operations
   - Session data stored in `./data/` directory (gitignored)

2. **MCPServer** (`src/mcp-server.ts`)
   - Simple HTTP server exposing 3 endpoints:
     - `GET /health` - Server status check
     - `GET /tools` - List available tools
     - `POST /execute` - Execute a tool with parameters
   - Handles JSON-RPC style requests

3. **Tools** (`src/tools/index.ts`)
   - 7 WhatsApp tools: send_message, get_chats, get_messages, search_messages, get_contacts, get_groups, get_chat_info
   - Each tool has name, description, parameters schema, and handler function

4. **Configuration** (`src/utils/config.ts`)
   - Loads from `.env` file using dotenv
   - Configurable: MCP_PORT, SESSION_STORAGE_PATH, AUTO_LOGIN, LOG_LEVEL

5. **Logger** (`src/utils/logger.ts`)
   - Simple level-based logger (debug, info, warn, error)
   - Respects LOG_LEVEL from config

### Important File Locations

- **Entry point**: `src/index.ts`
- **Types**: `src/types/whatsapp.ts`
- **Session storage**: `data/` (contains auth tokens - SENSITIVE)
- **Config**: `.env` (gitignored, copy from `.env.example`)

## Working with This Codebase

### Adding a New Tool

1. Add the tool definition to `src/tools/index.ts` in the `tools` array
2. Define the tool's parameters schema (JSON Schema format)
3. Implement the handler function that calls WhatsAppClient methods
4. Tool is automatically exposed via `/execute` endpoint

### Modifying WhatsApp Client

- All WhatsApp interactions go through `WhatsAppClient` class
- Uses `whatsapp-web.js` library under the hood
- Session persistence is handled automatically by `LocalAuth`
- Client must be ready (authenticated) before tool execution

### Testing Changes

```bash
# Start server
npm run dev

# In another terminal, check health
curl http://localhost:3000/health

# List tools
curl http://localhost:3000/tools

# Execute a tool
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_chats", "params": {"limit": 5}}'
```

### Authentication Flow

1. First run: WhatsApp client generates QR code in terminal
2. Scan with phone to authenticate
3. Session saved to `data/` directory
4. Subsequent runs auto-login if session valid

## Security Considerations

- **NEVER commit `data/` or `.env`** - contains auth tokens
- Server is HTTP only - meant for localhost only
- No authentication on MCP endpoints - assume trusted local environment
- Session files are equivalent to passwords

## TypeScript Configuration

- ES2022 modules (`"type": "module"` in package.json)
- All imports must use `.js` extension (TypeScript quirk for ES modules)
- Output directory: `dist/`
- Source maps enabled for debugging

## Common Issues

1. **"Client is not ready" error**: Wait for authentication or check session validity
2. **Port already in use**: Change MCP_PORT in .env
3. **QR code not showing**: Ensure terminal supports it or check qrcode-terminal output
4. **Session expired**: Delete `data/` and re-authenticate

## Chat ID Formats

- Individual contacts: `[country_code][number]@c.us` (e.g., `12025551234@c.us`)
- Groups: Obtain from `get_groups` or `get_chats` (format: `xxxxx-xxxxx@g.us`)

## Extension Ideas

- Media sending (images, documents)
- Auto-responders
- Message scheduling
- Integration with other AI agent workflows
- LangGraph/OpenAI function calling integration
