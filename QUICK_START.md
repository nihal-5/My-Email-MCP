# Resume Automation Quick Start Guide

## ✅ What's Built

Your resume automation system is **100% complete** and ready to test!

### System Components

1. **WhatsApp MCP Server** - Monitors WhatsApp for JD from Srinu
2. **Resume Tools** - Parse JD, tailor resume, validate, render PDF
3. **Email Sender** - SMTP integration to send resume to recruiters
4. **LangGraph Orchestrator** - Workflow automation (Python)
5. **Srinu Monitor** - Polls WhatsApp every 30 seconds for new JDs

## 🔧 Configuration Required

### Step 1: Gmail App Password

You need a Gmail App Password for sending emails:

1. Go to: https://myaccount.google.com/apppasswords
2. Select "Mail" and your device
3. Copy the 16-character password
4. Update `.env` file:

```bash
SMTP_USER=nihal.veeramalla@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx   # Replace with your app password
FROM_EMAIL=nihal.veeramalla@gmail.com
```

### Step 2: Update Email Addresses

Edit `/Users/nihalveeramalla/projects/agentkit/.env`:

```bash
# Email Configuration
CC_EMAIL=nihal.veeramalla@gmail.com
TO_EMAIL=fallback_recruiter@example.com  # Used if JD has no email
```

## 🚀 Running the System

### Start the Server

```bash
cd /Users/nihalveeramalla/projects/agentkit
npm start
```

On first run:
- A QR code will appear
- Scan with WhatsApp app (Settings → Linked Devices)
- Next time it auto-connects!

### What Happens Automatically

1. Server starts and connects to WhatsApp
2. **Srinu Monitor** starts polling every 30 seconds
3. When Srinu sends a message > 200 chars:
   - ✅ Parse JD → extract role, cloud (Azure/AWS/GCP), location, recruiter email
   - ✅ Tailor resume → cloud-specific substitutions
   - ✅ Validate → 12/8/5 bullets, ASCII only, cloud alignment
   - ✅ Render PDF → LaTeX → PDF with tectonic
   - ✅ Email → Send to recruiter with CC to you
   - ✅ WhatsApp reply → Success or validation errors

## 🧪 Manual Testing

### Test 1: Check Server Health

```bash
curl http://localhost:3000/health
```

Expected: `{"status":"ok","ready":true}`

### Test 2: List Available Tools

```bash
curl http://localhost:3000/tools
```

You should see 11 tools: 7 WhatsApp + 4 Resume tools

### Test 3: Parse a Sample JD

```bash
curl -X POST http://localhost:3000/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "parse_jd",
    "params": {
      "jd": "Role: Senior AI Engineer\nLocation: Dallas, TX\nTech Stack: Azure ML, Python, Kubernetes\nContact: recruiter@fiserv.com"
    }
  }'
```

Expected: `{"role": "Senior AI Engineer", "cloud": "azure", "location": "Dallas, TX", "recruiterEmail": "recruiter@fiserv.com"}`

### Test 4: Test Python Orchestrator

```bash
cd /Users/nihalveeramalla/projects/agentkit
export JD_TEXT="Role: ML Engineer at Fiserv\nAzure ML, Python\nContact: test@fiserv.com"
export TO_EMAIL="your_test_email@gmail.com"
export CC_EMAIL="nihal.veeramalla@gmail.com"
python3 orchestrator/main.py
```

This will:
- Parse the JD
- Tailor your resume for Azure
- Validate the resume
- Render PDF to `./outbox/`
- Send email to test@fiserv.com

## 📁 File Locations

- **Resume Template**: `/Users/nihalveeramalla/projects/agentkit/src/resume-tools/templates/resume.tex.tmpl`
- **Output PDFs**: `/Users/nihalveeramalla/projects/agentkit/outbox/`
- **Logs**: Console output (configure LOG_LEVEL in .env)
- **Session**: `/Users/nihalveeramalla/projects/agentkit/data/` (WhatsApp auth)

## 🎯 Srinu's WhatsApp Number

The monitor is configured for: **+91 7702055194**

To change, edit: `/Users/nihalveeramalla/projects/agentkit/src/monitors/srinu-monitor.ts` line 12

## ⚡ Quick Commands

```bash
# Build the project
npm run build

# Start server (production)
npm start

# Start in development mode (auto-reload)
npm run dev

# Stop server
Ctrl+C
```

## 🐛 Troubleshooting

### QR Code doesn't appear
- Ensure port 3000 is not in use: `lsof -ti:3000 | xargs kill -9`
- Try increasing terminal font size

### Email not sending
- Check Gmail App Password is correct
- Verify SMTP settings in `.env`
- Check `outbox/` for PDF generation errors

### Resume validation fails
- Check bullet counts: Fiserv (12), Hyperleap (8), Infinite (5)
- Ensure ASCII only (no special characters)
- Verify cloud alignment (no AWS for Fiserv unless JD mentions it)

### Python orchestrator errors
- Check dependencies: `uv pip list | grep langgraph`
- Install if missing: `uv pip install langgraph langchain requests`

## 🔥 Production Workflow

Once tested and working:

1. Keep server running: `npm start`
2. Srinu sends JD via WhatsApp
3. System auto-processes and emails resume
4. You get WhatsApp confirmation message
5. Check `./outbox/` for PDF copies

## 📊 Validation Rules

### Bullet Counts
- **Fiserv**: Exactly 12 bullets
- **Hyperleap AI**: Exactly 8 bullets (first = segmentation project)
- **Infinite Infolab**: Exactly 5 bullets

### Cloud Platform Rules
- **Fiserv**: Azure by default; GCP only if JD mentions GCP/Vertex/BigQuery
- **Hyperleap**: AWS constant (Textract, SageMaker, EKS)
- **Never AWS for Fiserv** (unless explicitly in JD)

### Style Rules
- ASCII only (no unicode/special chars)
- No `\\textbf{}` inside bullet points
- Validation is hard gate (no email if fails)

## 💡 Customization

Want to modify the resume template?

Edit: `/Users/nihalveeramalla/projects/agentkit/src/resume-tools/templates/resume.tex.tmpl`

Placeholders available:
- `{{CLOUD}}` - Replaced with Azure/AWS/GCP
- `{{ROLE}}` - Job role
- `{{LOCATION}}` - Job location

## 🎉 You're Ready!

Your system is **gold-standard** and ready to automate resume sending. Just configure the Gmail App Password and test!

Questions? Check:
- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `RESUME_AUTOMATION_STATUS.md` - Component status
