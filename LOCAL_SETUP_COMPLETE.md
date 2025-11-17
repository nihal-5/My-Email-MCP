# 🎉 WhatsApp Resume Bot - Running Locally!

## ✅ System Status: ACTIVE

Your WhatsApp Resume Automation system is **running locally** on your Mac with PM2.

---

## 🚀 Quick Access

### Approval Dashboard
**URL:** http://localhost:3001/approval

**What it does:**
- Review AI-customized resumes before sending
- Approve or reject with one click
- WhatsApp notifications for approvals

### MCP Server
**URL:** http://localhost:3000

**Endpoints:**
- `GET /health` - Health check
- `GET /tools` - List available tools
- `POST /execute` - Execute MCP tools

---

## 📱 How It Works

1. **Srinu sends you a JD on WhatsApp** (+91 77020 55194)
2. **Bot detects the message** (scans every 30 seconds)
3. **AI customizes your resume** (using free Hugging Face/Groq)
4. **Generates PDF** (professional LaTeX formatting)
5. **Dashboard shows preview** → You approve/reject
6. **Email sent automatically** (after your approval)
7. **WhatsApp confirmation** → You get notified

---

## 🛠️ PM2 Management Commands

### View Status
```bash
pm2 status
```

### View Live Logs
```bash
pm2 logs
```

### Restart
```bash
pm2 restart all
```

### Stop
```bash
pm2 stop all
```

### Delete (complete removal)
```bash
pm2 delete all
```

### Start Again
```bash
pm2 start ecosystem.config.cjs
```

---

## 📊 What's Running

| Service | Port | Status | Description |
|---------|------|--------|-------------|
| **MCP Server** | 3000 | ✅ Online | WhatsApp monitoring & tools |
| **Dashboard** | 3001 | ✅ Online | Approval interface |
| **PM2 Process** | - | ✅ Running | Process manager |

---

## 🔍 Checking Logs

### Live logs (all output)
```bash
pm2 logs
```

### Only errors
```bash
pm2 logs --err
```

### Last 50 lines
```bash
pm2 logs --lines 50
```

### Follow new logs
```bash
pm2 logs --follow
```

---

## 🔄 When You Restart Your Mac

PM2 does **NOT** auto-start on Mac reboot by default.

### Option 1: Start manually after reboot
```bash
cd ~/projects/agentkit
pm2 start ecosystem.config.cjs
```

### Option 2: Auto-start on Mac login (one-time setup)
```bash
pm2 startup
# Follow the command it shows
pm2 save
```

---

## 🧪 Testing the System

### 1. Check WhatsApp is connected
```bash
pm2 logs | grep "ready"
# Should see: "WhatsApp client is ready!"
```

### 2. Access the dashboard
```bash
open http://localhost:3001/approval
```

### 3. Send a test JD
- Have Srinu send a JD on WhatsApp
- Wait 30-60 seconds
- Check dashboard for the approval request

---

## 📝 Making Changes

### After editing code:

```bash
# 1. Build
npm run build

# 2. Restart PM2
pm2 restart all

# 3. Check logs
pm2 logs --lines 20
```

---

## 🔒 Environment Variables

Your secrets are in `.env` file (NOT committed to Git):

```bash
# View current environment
cat .env

# Edit environment
nano .env
# or
code .env
```

**After changing .env:**
```bash
pm2 restart all --update-env
```

---

## 🎯 Key Features

### ✅ What Works Locally:
- ✅ WhatsApp monitoring
- ✅ AI resume customization
- ✅ PDF generation
- ✅ Approval dashboard
- ✅ Email sending
- ✅ WhatsApp notifications

### ❌ What Doesn't Work (vs Cloud):
- ❌ Won't run when laptop is closed
- ❌ Won't run when laptop is off
- ❌ Not accessible from phone (unless on same Wi-Fi)
- ❌ Requires Mac to stay on

---

## 🌐 Future: Cloud Deployment (Optional)

When you're ready, you can deploy to Oracle Cloud (FREE) for 24/7 operation:

**Benefits:**
- ✅ Runs 24/7 (even when Mac is off)
- ✅ Access from anywhere (phone, tablet, etc.)
- ✅ Auto-deploys with Git push
- ✅ $0 cost forever

**Setup time:** ~30 minutes

**Guide:** See `ORACLE_CLOUD_DEPLOYMENT.md`

---

## 🆘 Troubleshooting

### PM2 process crashed
```bash
pm2 logs --err  # See error
pm2 restart all # Restart
```

### Dashboard not loading
```bash
# Check if running
pm2 status

# Check port 3001 is free
lsof -i :3001

# Restart
pm2 restart all
```

### WhatsApp not connecting
```bash
# Check logs for QR code
pm2 logs | tail -50

# Scan QR code with your phone
# WhatsApp → Linked Devices → Link a Device
```

### "Port already in use"
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart PM2
pm2 restart all
```

---

## 📚 Documentation Files

- `README.md` - Main project documentation
- `GIT_AND_CICD_SETUP.md` - Git workflow & GitHub Actions
- `GITHUB_SECRETS_SETUP.md` - GitHub secrets configuration
- `ORACLE_CLOUD_DEPLOYMENT.md` - Cloud deployment guide
- `APPROVAL_SYSTEM.md` - How approval system works
- `EMAIL_SETUP.md` - Email configuration guide

---

## 🎉 You're All Set!

### Next Steps:

1. **Open the dashboard:**
   ```bash
   open http://localhost:3001/approval
   ```

2. **Check WhatsApp connected:**
   ```bash
   pm2 logs | grep "ready"
   ```

3. **Test with a real JD:**
   - Have Srinu send a JD
   - Wait 30-60 seconds
   - Check dashboard

---

## 💡 Tips

- Keep terminal open to see `pm2 logs` in real-time
- Dashboard auto-refreshes every 30 seconds
- PDF files saved in `outbox/` folder
- Drafts saved in `data/drafts/` before approval

---

**System is LIVE and ready! 🚀**

Questions? Check the other documentation files or run `pm2 logs` to see what's happening.
