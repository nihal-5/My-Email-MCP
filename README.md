# WhatsApp MCP Server (agentkit)

A secure, local-first WhatsApp automation server that exposes WhatsApp Web functionality through a Model Context Protocol (MCP) interface. Built for personal use with AI agents.

## 🔑 Key Features

- **100% Local** - All data stays on your machine, no cloud services
- **Personal Use Only** - Designed for single-user automation
- **Session Persistence** - QR code login only needed once
- **MCP Interface** - Standard JSON-based API for AI agents
- **Secure by Design** - Local authentication, no external dependencies

## 📋 Prerequisites

- Node.js >= 18.0.0
- WhatsApp account with mobile app
- Personal machine (not shared/production environment)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or navigate to project directory
cd ~/projects/agentkit

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env
```

### 2. Configuration

Edit `.env` to customize settings (optional):

```env
MCP_PORT=3000                    # Server port
SESSION_STORAGE_PATH=./data      # Where to store session
AUTO_LOGIN=true                  # Auto-reconnect on restart
LOG_LEVEL=info                   # debug, info, warn, error
```

### 3. First Run

```bash
# Development mode with auto-reload
npm run dev

# Or build and run
npm run build
npm start
```

### 4. Authentication

On first run, a QR code will appear in your terminal:
1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Tap **Link a Device**
4. Scan the QR code displayed in terminal

Session is saved locally - next time it auto-connects!

## 🛠 Available Tools

The server exposes 7 WhatsApp tools via MCP:

| Tool | Description | Parameters |
|------|-------------|------------|
| `send_message` | Send text to contact/group | `chatId`, `message` |
| `get_chats` | List recent conversations | `limit?` |
| `get_messages` | Get messages from a chat | `chatId`, `limit?` |
| `search_messages` | Search messages by keyword | `query`, `chatId?`, `limit?` |
| `get_contacts` | List all contacts | - |
| `get_groups` | List group chats | - |
| `get_chat_info` | Get chat metadata | `chatId` |

## 📡 API Endpoints

### Check Server Health
```bash
curl http://localhost:3000/health
```

### List Available Tools
```bash
curl http://localhost:3000/tools
```

### Execute a Tool
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "send_message",
    "params": {
      "chatId": "1234567890@c.us",
      "message": "Hello from MCP!"
    }
  }'
```

## 💡 Usage Examples

### Example 1: Get Recent Chats
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{"tool": "get_chats", "params": {"limit": 5}}'
```

### Example 2: Search Messages
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "search_messages",
    "params": {
      "query": "job description",
      "limit": 10
    }
  }'
```

### Example 3: Send Message
```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "send_message",
    "params": {
      "chatId": "1234567890@c.us",
      "message": "Thanks for the JD! Preparing customized resume..."
    }
  }'
```

## 📝 Chat ID Format

- **Individual contacts**: `[country_code][number]@c.us`
  - Example: `12025551234@c.us`
- **Groups**: Get from `get_groups` or `get_chats` tools
  - Example: `123456789-1234567890@g.us`

## 🔐 Security & Privacy

### ⚠️ IMPORTANT
- Session files contain authentication tokens - treat as **passwords**
- Only run on your **personal machine**
- Never expose MCP port to the internet
- Store `.env` and `data/` securely
- Add `data/` to `.gitignore` (already included)

### Revoking Access
If you need to revoke access:
1. Open WhatsApp on your phone
2. Go to **Settings → Linked Devices**
3. Find "whatsapp-mcp" session
4. Tap and select **Log Out**

## 🏗 Project Structure

```
agentkit/
├── src/
│   ├── index.ts              # Main entry point
│   ├── whatsapp-client.ts    # WhatsApp Web wrapper
│   ├── mcp-server.ts         # HTTP/MCP server
│   ├── tools/                # Tool implementations
│   │   └── index.ts
│   ├── types/                # TypeScript types
│   │   └── whatsapp.ts
│   └── utils/                # Utilities
│       ├── config.ts
│       └── logger.ts
├── data/                     # Session storage (gitignored)
├── .env                      # Configuration (gitignored)
└── package.json
```

## 🛠 Development Commands

```bash
# Run in development mode
npm run dev

# Build TypeScript
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## 🚧 Future Extensions

- [ ] Media sending (images, documents, voice)
- [ ] Auto-responder logic
- [ ] Scheduled messages
- [ ] Integration with resume-builder agent
- [ ] LangGraph/OpenAI Workflow triggers
- [ ] Message templates

## 🐛 Troubleshooting

### QR Code doesn't appear
- Check that port 3000 isn't already in use
- Ensure terminal supports QR code rendering
- Try increasing terminal font size

### "Client is not ready" error
- Wait for initialization to complete
- Check WhatsApp is linked on your phone
- Delete `data/` folder and re-authenticate

### Session expired
- Re-scan QR code
- Check phone has internet connection
- Ensure WhatsApp app is up to date

## 📄 License

MIT

## ⚠️ Disclaimer

This is a personal automation tool. Use responsibly and in compliance with WhatsApp's Terms of Service. Not intended for:
- Spam or bulk messaging
- Commercial use
- Automated bot responses at scale
- Any activity that violates WhatsApp policies
