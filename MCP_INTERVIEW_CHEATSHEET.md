# 🎯 MCP (Model Context Protocol) Interview Cheat Sheet

## 📋 What is MCP?

**Definition**: Model Context Protocol (MCP) is a standardized communication protocol that allows AI models and orchestrators to interact with external tools and services through a consistent HTTP/JSON API.

**Analogy**: Think of MCP like a restaurant menu - it lists all available "dishes" (tools) with descriptions and ingredients (parameters), so the "customer" (AI model) knows exactly what to order and what to expect.

---

## 🏗️ Architecture Overview

```
┌─────────────────┐
│   AI Client     │  (Python/LangGraph Orchestrator)
│  (Consumer)     │
└────────┬────────┘
         │ HTTP POST /execute
         │ {"tool": "parse_jd", "params": {...}}
         ▼
┌─────────────────┐
│   MCP Server    │  (Node.js/TypeScript)
│  Port 3000      │  - Receives requests
└────────┬────────┘  - Routes to tools
         │ Function Call
         ▼
┌─────────────────┐
│  Tool Handlers  │  (Business Logic)
│  (5 Tools)      │  - parse_jd
└─────────────────┘  - tailor_resume
                     - validate_resume
                     - generate_email
                     - submit_for_approval
```

---

## 🔑 Key Components

### 1. **MCP Server** (`src/mcp-server.ts`)
- **Purpose**: HTTP server that exposes tools to clients
- **Port**: 3000
- **Protocol**: HTTP/JSON
- **Key Route**: `POST /execute`

```typescript
// Request format
{
  "tool": "parse_jd",
  "params": { "jd": "AI Engineer position..." }
}

// Response format
{
  "success": true,
  "result": { "role": "AI Engineer", "cloud": "azure" }
}
```

### 2. **Tool Registry** (`src/tools/index.ts`)
- **Structure**: Array of tool definitions
- **Each tool has**:
  - `name`: Unique identifier
  - `description`: What it does
  - `parameters`: JSON schema (types, required fields)
  - `handler`: Async function that executes the logic

```typescript
export const tools: Tool[] = [
  {
    name: 'parse_jd',
    description: 'Parse job description to extract role, cloud, location',
    parameters: {
      type: 'object',
      properties: {
        jd: { type: 'string', description: 'Full job description text' }
      },
      required: ['jd']
    },
    handler: async (client, params) => {
      const parsed = parseJD(params.jd);
      return parsed;
    }
  }
]
```

### 3. **Tool Executor** (`executeTool()`)
- **Purpose**: Dynamic routing - finds and executes the right tool
- **Process**:
  1. Search `tools[]` array by name
  2. Validate parameters against schema
  3. Call `tool.handler()`
  4. Return result

### 4. **Client** (`orchestrator/main.py`)
- **Purpose**: Consumes MCP tools
- **Communication**: HTTP POST requests

```python
def mcp_execute(tool: str, payload: dict) -> dict:
    r = requests.post(
        f"http://localhost:3000/execute",
        json={"tool": tool, "params": payload},
        timeout=60
    )
    return r.json().get("result", {})
```

---

## 🎤 Interview Q&A

### **Q1: What is MCP and why did you use it?**
**A**: MCP (Model Context Protocol) is a standardized way to expose automation tools to AI models. I used it because:
- **Standardization**: Provides a consistent interface for AI orchestrators
- **Language Agnostic**: Python client can call TypeScript tools seamlessly
- **Tool Discovery**: AI models can see available tools and their schemas
- **Separation of Concerns**: Business logic (tools) separated from orchestration (AI workflow)

### **Q2: How does MCP work in your system?**
**A**: 
1. **Server Side**: Node.js MCP server on port 3000 exposes 5 tools
2. **Client Side**: Python LangGraph orchestrator makes HTTP requests
3. **Communication**: JSON payloads with `{tool, params}` structure
4. **Execution**: Server routes requests to TypeScript handlers
5. **Response**: JSON results sent back to orchestrator

### **Q3: What's the difference between MCP server and regular API?**
**A**: 
| Feature | MCP Server | Regular API |
|---------|-----------|-------------|
| **Purpose** | Tool exposure for AI | General data/services |
| **Structure** | Tool registry with schemas | Custom endpoints |
| **Discoverability** | Self-documenting tools | Requires manual docs |
| **Target** | AI agents/orchestrators | Human developers/apps |
| **Standard** | MCP protocol | REST/GraphQL/custom |

### **Q4: How many MCP servers did you build?**
**A**: **ONE MCP server** on port 3000 that exposes **5 tools**:
1. `parse_jd` - Extract job details
2. `tailor_resume` - Generate LaTeX resume
3. `validate_resume` - Check resume quality
4. `generate_personalized_email` - Create custom emails
5. `submit_for_approval` - Queue for human review

**Note**: We also have an Express.js web server on port 3001 for the approval dashboard, but that's NOT an MCP server.

### **Q5: Is MCP stateful or stateless?**
**A**: **Stateless**. Each request is independent - the MCP server doesn't store session data between calls. The Python orchestrator maintains workflow state using LangGraph's state machine.

### **Q6: How do you handle errors in MCP?**
**A**: Three layers:
1. **Parameter Validation**: JSON schema checks before execution
2. **Try-Catch in Handlers**: Each tool handler has error handling
3. **HTTP Status Codes**: 
   - 200: Success
   - 400: Invalid request (missing tool/params)
   - 500: Server error (handler failed)

```typescript
try {
  const result = await tool.handler(client, params);
  res.end(JSON.stringify({ success: true, result }));
} catch (error) {
  res.end(JSON.stringify({ 
    success: false, 
    error: error.message 
  }));
}
```

### **Q7: Can multiple clients use the same MCP server?**
**A**: **Yes!** MCP is designed for multi-client scenarios. In theory:
- Python orchestrator (our current client)
- Claude Desktop/VS Code (MCP-compatible tools)
- Custom AI agents
- Web frontends

All can call the same MCP server concurrently.

### **Q8: What are the benefits of MCP over direct function calls?**
**A**: 
- ✅ **Cross-Language**: Python calls TypeScript without bindings
- ✅ **Network Separation**: Client and server can run on different machines
- ✅ **Tool Isolation**: Server crash doesn't kill client
- ✅ **Scalability**: Can load-balance multiple MCP server instances
- ✅ **Security**: HTTP layer allows authentication/rate limiting

### **Q9: How do you secure your MCP server?**
**A**: Currently localhost-only (port 3000). For production:
- API key authentication in headers
- Rate limiting per client
- Input sanitization (already done via JSON schema)
- HTTPS for encrypted transport
- IP whitelisting

### **Q10: What's the latency of MCP calls?**
**A**: 
- **Network overhead**: ~5-10ms (localhost HTTP)
- **Tool execution**: Varies by tool
  - `parse_jd`: 2-5 seconds (AI parsing)
  - `tailor_resume`: 3-8 seconds (LaTeX generation)
  - `generate_email`: 3-7 seconds (AI writing)
- **Total**: Network is negligible; AI processing dominates

---

## 💡 Technical Deep Dive

### **MCP vs Claude Desktop Integration**
- **Claude Desktop**: Uses stdio transport (stdin/stdout)
- **Your MCP**: Uses HTTP transport (better for remote/distributed systems)
- **Both**: Follow MCP standard for tool definitions

### **Data Flow Example**
```
1. User sends JD via WhatsApp
   ↓
2. Python orchestrator receives JD
   ↓
3. POST http://localhost:3000/execute
   {"tool": "parse_jd", "params": {"jd": "..."}}
   ↓
4. MCP server receives request
   ↓
5. executeTool() finds "parse_jd" in tools[]
   ↓
6. Calls handler: parseJD(params.jd)
   ↓
7. parseJD() uses AI to extract:
   - role, cloud, location, recruiterName
   ↓
8. Returns result to handler
   ↓
9. Handler returns to executeTool()
   ↓
10. Server sends HTTP response:
    {"success": true, "result": {...}}
   ↓
11. Python orchestrator processes result
   ↓
12. Next tool in workflow called...
```

### **Why Not gRPC/GraphQL?**
- **MCP Standard**: Defined by Anthropic for AI tool exposure
- **Simplicity**: JSON is universally supported
- **Debugging**: HTTP requests easy to inspect/test
- **Compatibility**: Works with any HTTP client

---

## 🚀 Advanced Concepts

### **Tool Composition**
Tools can call other tools internally:
```typescript
handler: async (client, params) => {
  const parsed = parseJD(params.jd);
  const tailored = await tailorResume(parsed.cloud);
  return { parsed, tailored };
}
```

### **Async Operations**
All handlers are `async` - can perform:
- AI API calls (HuggingFace, Groq)
- File I/O (LaTeX compilation)
- Database queries
- External API requests

### **Parameter Validation**
JSON Schema ensures type safety:
```typescript
parameters: {
  type: 'object',
  properties: {
    cloud: { 
      type: 'string', 
      enum: ['azure', 'aws', 'gcp']  // Only these values allowed
    }
  },
  required: ['cloud']  // Must be present
}
```

---

## 📊 System Stats

| Metric | Value |
|--------|-------|
| **MCP Servers** | 1 (port 3000) |
| **Web Servers** | 1 (port 3001, Express.js) |
| **Tools Exposed** | 5 (resume automation) |
| **Client Languages** | Python 3.13 |
| **Server Language** | TypeScript/Node.js |
| **Protocol** | HTTP/JSON |
| **Uptime** | 24/7 via PM2 |
| **Avg Response Time** | 3-5 seconds (AI-dependent) |

---

## 🎯 One-Liner Summary

**"MCP is like a waiter in a restaurant: the AI customer (Python client) reads the menu (tool registry), orders a dish (HTTP request), and the waiter (MCP server) delivers it from the kitchen (tool handler) - all following a standard service protocol."**

---

## 🔗 Related Technologies

- **LangGraph**: State machine orchestration (client-side)
- **Express.js**: Web server framework (approval dashboard)
- **PM2**: Process manager (keeps MCP server running)
- **JSON Schema**: Parameter validation standard
- **RESTful API**: Design pattern (stateless HTTP)

---

## ✅ Key Takeaways

1. **MCP = Standardized AI Tool Interface**
2. **1 Server, 5 Tools** (not 5 servers)
3. **HTTP/JSON** for cross-language communication
4. **Stateless** - no session management
5. **Tool Registry** - self-documenting with schemas
6. **Dynamic Routing** - executeTool() finds handlers
7. **Separation** - business logic ≠ orchestration
8. **Scalable** - can add tools without changing client

---

**Last Updated**: November 7, 2025
**Author**: Nihal Veeramalla
**Project**: AI-Powered Resume Automation System
