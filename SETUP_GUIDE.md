# Resume Automation System - Complete Setup Guide

## 🎯 What This System Does

Automatically converts job descriptions from WhatsApp into tailored resumes and emails them to recruiters:

1. **Monitors WhatsApp** - Polls for messages from Srinu (+91 77020 55194)
2. **Parses JD** - Extracts role, cloud platform (Azure/GCP/AWS), location, recruiter email
3. **Tailors Resume** - Generates LaTeX with cloud-specific terms
4. **Validates** - Enforces 12/8/5 bullet counts, ASCII-only, cloud alignment
5. **Renders PDF** - Compiles LaTeX to PDF using tectonic
6. **Emails** - Sends PDF to recruiter with CC
7. **Replies** - Confirms success or reports errors on WhatsApp

## ✅ What's Already Done

- ✅ WhatsApp MCP Server running and authenticated
- ✅ 11 Tools integrated (7 WhatsApp + 4 Resume)
- ✅ LaTeX template with your resume
- ✅ Validation engine with strict rules
- ✅ Python LangGraph orchestrator
- ✅ WhatsApp monitor (Srinu detector)

## 🚀 Quick Start (3 Steps)

### Step 1: Accept Xcode License & Install tectonic

```bash
# Accept Xcode license
sudo xcodebuild -license accept

# Install tectonic LaTeX compiler
brew install tectonic
```

### Step 2: Install Python Dependencies

```bash
# Install LangGraph and dependencies
pip3 install langgraph langchain requests
```

### Step 3: Configure Email

```bash
# Copy environment template
cp .env.example .env

# Edit .env and set your Gmail credentials
nano .env
```

**For Gmail App Password:**
1. Go to https://myaccount.google.com/security
2. Enable 2-Factor Authentication
3. Go to "App passwords"
4. Generate password for "Mail"
5. Copy password to `SMTP_PASS` in `.env`

**.env Configuration:**
```env
# Email Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nihal.veeramalla@gmail.com
SMTP_PASS=your_16_char_app_password
FROM_EMAIL=nihal.veeramalla@gmail.com
CC_EMAIL=nihal.veeramalla@gmail.com
```

## 🧪 Test the System

### Test 1: Check Server is Running

```bash
# Server should already be running from earlier
# If not, start it:
npm run dev
```

You should see:
```
✅ WhatsApp MCP Server is running!
📱 Monitoring WhatsApp for JD from Srinu (+91 77020 55194)
🔄 Polling every 30 seconds
```

### Test 2: List All Tools

```bash
curl http://localhost:3000/tools | jq '.tools[].name'
```

Should output 11 tools including:
- `parse_jd`
- `tailor_resume`
- `validate_resume`
- `render_and_email`

### Test 3: Test JD Parser

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "parse_jd",
    "params": {
      "jd": "Job Title: AI Engineer\nLocation: Dallas, TX\nWe need someone with GCP and Vertex AI experience.\nRecruiter: john@example.com"
    }
  }' | jq
```

Should return:
```json
{
  "role": "AI Engineer",
  "cloud": "gcp",
  "location": "Dallas, TX",
  "recruiterEmail": "john@example.com"
}
```

### Test 4: Test Resume Tailor

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "tailor_resume",
    "params": {
      "cloud": "azure",
      "role": "AI Engineer",
      "location": "Dallas, TX"
    }
  }' | jq -r '.result.latex' | head -20
```

Should return LaTeX with Azure-specific terms.

### Test 5: Test Full Workflow (Manual)

```bash
# Set environment
export TO_EMAIL="your_test_email@gmail.com"
export JD_TEXT="Job Title: GenAI Engineer
Location: Dallas, TX (Hybrid)
We're looking for an AI Engineer with Azure experience...
(add more text to make it > 200 chars)
Recruiter: test@example.com"

# Run orchestrator
python3 ./orchestrator/main.py
```

Check your email for the PDF!

## 📱 Test Live with WhatsApp

### Option A: Have Srinu Send a Real JD

Just wait for Srinu to send you a job description. The system will:
1. Detect it automatically (> 200 chars)
2. Process it through the workflow
3. Reply on WhatsApp with status

### Option B: Test with Another Contact

If you want to test before Srinu sends something:

1. **Temporarily change monitor** - Edit `src/monitors/srinu-monitor.ts`:
   ```typescript
   const SRINU_CHAT_ID = 'YOUR_TEST_NUMBER@c.us';  // e.g., '15551234567@c.us'
   ```

2. **Restart server**:
   ```bash
   npm run dev
   ```

3. **Send yourself a test JD** from another phone

4. **Watch the logs** - You'll see the workflow execute

5. **Revert change** - Change back to Srinu's number when done

## 🔧 System Architecture

```
WhatsApp Message from Srinu (JD > 200 chars)
         ↓
  Srinu Monitor (TypeScript) - Polls every 30s
         ↓
  Python Orchestrator (LangGraph)
         ↓
    ┌────────────────────────────┐
    │   MCP Tools (via HTTP)     │
    ├────────────────────────────┤
    │ 1. parse_jd               │
    │ 2. tailor_resume          │
    │ 3. validate_resume        │
    │ 4. render_and_email       │
    └────────────────────────────┘
         ↓
  ┌─────────────────┐
  │ Validation Pass?│
  └─────────────────┘
      │           │
   YES│           │NO
      ↓           ↓
   Email      Reply WhatsApp
   PDF        with errors
      ↓
Reply WhatsApp
with success
```

## 📁 Project Structure

```
agentkit/
├── src/                      # TypeScript WhatsApp + MCP Server
│   ├── index.ts              # Main entry (starts monitor)
│   ├── whatsapp-client.ts    # WhatsApp wrapper
│   ├── mcp-server.ts         # HTTP server
│   ├── tools/index.ts        # 11 MCP tools
│   ├── monitors/
│   │   └── srinu-monitor.ts  # Polls for JD from Srinu
│   └── utils/
├── resume-tools/             # Resume generation logic
│   ├── templates/
│   │   └── resume.tex.tmpl   # LaTeX template
│   ├── parsers/
│   │   ├── jd-parser.ts      # Extract role/cloud/email
│   │   └── resume-tailor.ts  # Cloud substitutions
│   ├── validators/
│   │   └── resume-validator.ts  # 12/8/5 bullets, ASCII
│   ├── renderer.ts           # LaTeX → PDF (tectonic)
│   ├── emailer.ts            # SMTP with nodemailer
│   └── index.ts              # Main exports
├── orchestrator/
│   └── main.py               # LangGraph state machine
├── outbox/                   # Generated PDFs and LaTeX
├── .env                      # Your configuration
└── package.json
```

## 🎛 Environment Variables Reference

| Variable | Purpose | Example |
|----------|---------|---------|
| `SMTP_HOST` | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Your email | `nihal.veeramalla@gmail.com` |
| `SMTP_PASS` | App password | `abcd efgh ijkl mnop` |
| `FROM_EMAIL` | Sender address | `nihal.veeramalla@gmail.com` |
| `CC_EMAIL` | CC yourself | `nihal.veeramalla@gmail.com` |
| `TO_EMAIL` | Fallback recipient | `backup@example.com` |
| `ORCHESTRATOR_PATH` | Python script | `./orchestrator/main.py` |
| `MCP_BASE` | Server URL | `http://localhost:3000` |

## 🐛 Troubleshooting

### tectonic not found
```bash
brew install tectonic
which tectonic  # Should return /opt/homebrew/bin/tectonic
```

### Python modules not found
```bash
pip3 install langgraph langchain requests
python3 -c "import langgraph; print('OK')"
```

### Email authentication failed
- Make sure you're using an **App Password**, not your regular Gmail password
- Enable 2FA first, then generate app password
- Check SMTP_USER matches FROM_EMAIL

### Monitor not detecting messages
- Check `src/monitors/srinu-monitor.ts` has correct number
- Verify message length > 200 chars
- Check logs for errors

### PDF not generating
- Verify tectonic is installed
- Check `outbox/` directory exists (created automatically)
- Look in `outbox/` for `.tex` file to see if LaTeX was generated

### Validation failures
- Check `validation.errors` in WhatsApp reply
- Common issues:
  - Bullet count wrong (must be exactly 12/8/5)
  - `\\textbf{}` inside bullets
  - Wrong cloud alignment (Azure/GCP for Fiserv, AWS for Hyperleap)

## ✨ Next Steps

Your system is ready! Here's what happens automatically:

1. **Srinu sends JD** → Detected within 30 seconds
2. **System processes** → Parse → Tailor → Validate → Email
3. **You get notified** → WhatsApp message with status
4. **Recruiter gets email** → PDF attached, professional message
5. **Artifacts saved** → Check `outbox/` for PDFs and LaTeX

## 🎓 Manual Workflow Testing

Want to test the workflow without waiting for a real JD?

```bash
# Create test JD file
cat > test_jd.txt << 'EOF'
Job Title: Senior AI Engineer
Location: Dallas, TX (Hybrid - 3 days onsite)
Company: TechCorp Inc.

We're seeking an experienced AI Engineer with strong GCP and Vertex AI background.

Requirements:
- 5+ years ML/AI experience
- GCP, Vertex AI, BigQuery
- Python, LangChain, LangGraph
- Experience with RAG systems

Recruiter: jane.doe@techcorp.com
EOF

# Run orchestrator manually
export TO_EMAIL="your_email@gmail.com"
export JD_TEXT="$(cat test_jd.txt)"
python3 ./orchestrator/main.py
```

## 🚨 Important Reminders

1. **Never commit `.env`** - Contains passwords
2. **Backup `data/` folder** - Contains WhatsApp session
3. **Check `outbox/` weekly** - Clean up old PDFs
4. **Monitor logs** - Watch for errors in terminal
5. **Test email first** - Send test before live use

## 📞 Support

Questions? Check:
- `RESUME_AUTOMATION_STATUS.md` - Implementation details
- `CLAUDE.md` - Technical documentation
- `README.md` - WhatsApp MCP basics

---

**System Status: ✅ READY TO USE**

Just complete Steps 1-3 above, and your automated resume system will be live!
