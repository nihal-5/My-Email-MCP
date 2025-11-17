# 📚 Complete Libraries & Packages Reference

## 🔵 Node.js/TypeScript Packages (MCP Server + Tools)

### **Core Dependencies** (`package.json`)

| Package | Version | Purpose | Where Used |
|---------|---------|---------|------------|
| **whatsapp-web.js** | 1.23.0 | WhatsApp automation via Puppeteer | `src/whatsapp-client.ts` - Sends/receives messages |
| **puppeteer** | 24.15.0 | Headless Chrome browser automation | Used by whatsapp-web.js for WhatsApp Web |
| **nodemailer** | 6.9.7 | Email sending via SMTP (Gmail) | `src/resume-tools/emailer.ts` - Sends resume emails |
| **dotenv** | 16.3.1 | Load environment variables from .env | All files - API keys, credentials |
| **@huggingface/inference** | 4.13.1 | FREE AI (Llama-3-8B) - Primary | `src/resume-tools/ai-customizer.ts` - Email generation, JD parsing |
| **groq-sdk** | 0.34.0 | FREE AI (llama-3.1-70b) - Secondary | `src/resume-tools/ai-customizer.ts` - Fallback AI |
| **openai** | 6.8.1 | Paid AI (GPT-4) - Tertiary fallback | `src/resume-tools/ai-customizer.ts` - Last resort AI |
| **@google/generative-ai** | 0.24.1 | Google Gemini AI (not actively used) | Available for future use |
| **qrcode-terminal** | 0.12.0 | Display QR code in terminal for WhatsApp login | `src/whatsapp-client.ts` - First-time setup |

### **Development Dependencies** (`devDependencies`)

| Package | Version | Purpose | Where Used |
|---------|---------|---------|------------|
| **typescript** | 5.3.3 | TypeScript compiler | Compiles `.ts` to `.js` |
| **@types/node** | 20.10.6 | TypeScript type definitions for Node.js | Type safety for Node.js APIs |
| **@types/nodemailer** | 6.4.14 | TypeScript types for Nodemailer | Type safety for email code |
| **@types/qrcode-terminal** | 0.12.2 | TypeScript types for QR code | Type safety for QR display |
| **tsx** | 4.7.0 | TypeScript execution (dev mode) | `npm run dev` - Run without compiling |
| **eslint** | 8.56.0 | Code linter (finds bugs/style issues) | Code quality enforcement |
| **@typescript-eslint/parser** | 6.17.0 | ESLint TypeScript parser | Lints TypeScript code |
| **@typescript-eslint/eslint-plugin** | 6.17.0 | ESLint TypeScript rules | TypeScript-specific linting |
| **@playwright/test** | 1.56.1 | Browser testing framework | Testing (not actively used) |
| **playwright** | 1.56.1 | Browser automation for testing | Testing (not actively used) |

---

## 🟡 Python Packages (Orchestrator)

### **Core Libraries** (from `orchestrator/main.py`)

| Package | Purpose | Where Used |
|---------|---------|------------|
| **langgraph** | AI workflow orchestration with state machine | `orchestrator/main.py` - 5-node workflow (parse → tailor → validate → email → approve) |
| **requests** | HTTP client for API calls | `orchestrator/main.py` - Calls MCP server (POST http://localhost:3000/execute) |
| **typing** | Type hints for Python | Type safety in workflow state |
| **json** | JSON parsing/serialization | Parse MCP responses, read/write files |
| **os** | Operating system operations | File paths, environment variables |
| **sys** | System-specific functions | stderr output, exit codes |

**Install command**: `pip install langgraph requests`

---

## 🟢 System-Level Tools

### **External Software** (Not NPM/PIP)

| Tool | Purpose | Installation | Where Used |
|------|---------|-------------|------------|
| **pdflatex** | Compile LaTeX to PDF | MacTeX/TeX Live | `src/resume-tools/spec-generator.ts` - Generate resume PDFs |
| **PM2** | Process manager for Node.js | `npm install -g pm2` | Keep MCP server + dashboard running 24/7 |
| **Node.js** | JavaScript runtime | nodejs.org | Run MCP server and tools |
| **Python 3.13** | Python interpreter | python.org | Run orchestrator |
| **Git** | Version control | git-scm.com | Code management |

---

## 📦 Built-in Libraries (No Installation Needed)

### **Node.js Built-ins**
- `fs/promises` - File system operations (async)
- `http` - HTTP server creation
- `path` - File path manipulation
- `child_process` - Run shell commands (pdflatex)
- `crypto` - Hashing/encryption
- `util` - Utility functions

### **Python Built-ins**
- `os` - OS operations
- `json` - JSON handling
- `sys` - System operations
- `typing` - Type hints

---

## 🎯 Package Usage by Feature

### **1. WhatsApp Integration**
```
whatsapp-web.js (main library)
  └── puppeteer (browser automation)
        └── Chromium (headless browser)
  
qrcode-terminal (QR code display for login)
```

### **2. AI Email Generation**
```
Primary:  @huggingface/inference (FREE - Llama-3-8B)
          ↓ (if fails)
Secondary: groq-sdk (FREE - llama-3.1-70b)
          ↓ (if fails)
Tertiary:  openai (PAID - GPT-4)
```

### **3. Resume PDF Generation**
```
TypeScript Code
  └── Generates LaTeX (.tex file)
      └── pdflatex (system command)
          └── Produces PDF
```

### **4. Email Delivery**
```
nodemailer
  └── SMTP protocol (port 587)
      └── Gmail (smtp.gmail.com)
          └── TLS encryption
```

### **5. Orchestration**
```
langgraph
  └── StateGraph (state machine)
      └── 5 nodes (parse, tailor, validate, email, approve)
          └── requests (HTTP calls to MCP)
```

### **6. MCP Server**
```
Node.js http module
  └── Express-like routing
      └── POST /execute endpoint
          └── executeTool() function
```

---

## 🔧 Development Tools

| Tool | Purpose |
|------|---------|
| **VS Code** | Code editor with TypeScript/Python support |
| **Terminal** | Run commands, check logs |
| **Chrome DevTools** | Debug WhatsApp web automation |
| **jq** | Parse JSON in terminal (`jq '.[-1]'`) |

---

## 🎓 Interview-Ready Summary

**Interviewer**: "What libraries did you use?"

**You**: 

*"For the **Node.js MCP server**, I used:*
- *`whatsapp-web.js` with `puppeteer` for WhatsApp automation*
- *`nodemailer` for Gmail SMTP email sending*
- *`@huggingface/inference` and `groq-sdk` for FREE AI (LLMs)*
- *`openai` as a paid fallback*
- *`dotenv` for environment variable management*

*For the **Python orchestrator**, I used:*
- *`langgraph` for AI workflow state machines*
- *`requests` for HTTP communication with the MCP server*

*For **system tools**:*
- *`pdflatex` (TeX Live) for LaTeX to PDF compilation*
- *`PM2` for process management and 24/7 uptime*
- *Built-in Node.js modules (`http`, `fs`) for server and file ops*

*This gives me a **full-stack AI automation system** with cross-language communication (Python ↔ TypeScript) via HTTP/JSON."*

---

## 💰 Cost Breakdown

| Service | Cost | Usage |
|---------|------|-------|
| **HuggingFace Inference** | FREE | Primary AI (email generation, JD parsing) |
| **Groq** | FREE | Secondary AI fallback |
| **OpenAI GPT-4** | PAID (~$0.01/request) | Tertiary fallback (rarely used) |
| **Gmail SMTP** | FREE | Email sending |
| **WhatsApp** | FREE | Messaging |
| **PM2** | FREE | Process management |
| **pdflatex** | FREE | PDF generation |

**Total Monthly Cost**: ~$0-5 (mostly free!)

---

## 📊 Dependency Tree

```
agentkit (Root Project)
│
├── Node.js Server (Port 3000, 3001)
│   ├── whatsapp-web.js → puppeteer → Chromium
│   ├── nodemailer → SMTP → Gmail
│   ├── @huggingface/inference → HF API
│   ├── groq-sdk → Groq API
│   ├── openai → OpenAI API
│   └── dotenv → .env file
│
├── Python Orchestrator
│   ├── langgraph → StateGraph
│   └── requests → MCP HTTP calls
│
└── System Tools
    ├── pdflatex → LaTeX → PDF
    └── PM2 → Process Manager
```

---

## 🚀 Quick Install Reference

### **Node.js Setup**
```bash
npm install                    # Install all packages from package.json
npm run build                 # Compile TypeScript to JavaScript
npm start                     # Run compiled code
```

### **Python Setup**
```bash
pip install langgraph requests  # Install orchestrator dependencies
python orchestrator/main.py     # Run workflow
```

### **System Setup**
```bash
# macOS
brew install --cask mactex     # Install pdflatex
npm install -g pm2            # Install PM2 globally

# Verify
pdflatex --version            # Check LaTeX
pm2 --version                 # Check PM2
```

---

## 🔍 Package Size Analysis

| Package | Size | Notes |
|---------|------|-------|
| **puppeteer** | ~300 MB | Includes Chromium browser |
| **whatsapp-web.js** | ~5 MB | JavaScript wrapper |
| **nodemailer** | ~1 MB | Lightweight email client |
| **@huggingface/inference** | ~500 KB | API client only |
| **groq-sdk** | ~200 KB | Minimal SDK |
| **openai** | ~2 MB | Full SDK |
| **langgraph** | ~10 MB | Workflow engine |

**Total `node_modules/`**: ~350 MB (mostly Chromium)

---

## 📝 Notes

1. **No Express.js**: We built a custom HTTP server using Node.js `http` module for the MCP server. Approval dashboard uses basic Express-like routing.

2. **No Database**: All data stored in JSON files (`approval-queue.json`, session files).

3. **No Redis/Queue**: Simple file-based queue system for approvals.

4. **No Docker** (in dev): Runs directly on macOS with PM2. Docker setup available but not actively used.

5. **TypeScript Everywhere**: All Node.js code written in TypeScript for type safety.

---

**Last Updated**: November 7, 2025  
**Total Dependencies**: 9 runtime + 10 dev (Node.js) + 2 (Python)  
**Language Mix**: TypeScript (MCP/Tools), Python (Orchestrator), LaTeX (Resume), Bash (Scripts)
