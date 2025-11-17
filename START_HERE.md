# 🚀 START HERE - Resume Automation Setup

## ⚡ Quick Setup (5 Minutes Total!)

Your system is **95% ready**! Just need to configure Gmail email:

---

## 📧 Configure Email (ONE COMMAND!)

```bash
cd /Users/nihalveeramalla/projects/agentkit
./setup-email.sh
```

This script will:
1. ✅ Open Gmail App Password page for you
2. ✅ Guide you step-by-step
3. ✅ Update your .env file automatically
4. ✅ Test that email works
5. ✅ Confirm you're ready!

**That's it!** Just run that ONE command and follow the prompts.

---

## 🎯 What the Script Does

```
┌─────────────────────────────────────────┐
│  ./setup-email.sh                       │
└─────────────┬───────────────────────────┘
              │
              ├─► Opens: Gmail App Password page
              │   (You: Generate 16-char password)
              │
              ├─► Asks: "Paste your password"
              │   (You: Paste password)
              │
              ├─► Updates: .env file automatically
              │
              ├─► Tests: Sends test email
              │
              └─► Done! ✅
```

---

## 📝 Step-by-Step

### Step 1: Run the Setup Script
```bash
./setup-email.sh
```

### Step 2: Browser Opens
- Sign in to Google if needed
- Select: **Mail** → **Other (Custom name)**
- Type: `Resume Automation`
- Click: **Generate**

### Step 3: Copy Password
You'll see something like:
```
abcd efgh ijkl mnop
```
Copy it!

### Step 4: Paste Password
Come back to terminal and paste when asked:
```
Gmail App Password: [paste here]
```

### Step 5: Test Email
Script asks:
```
Send test email? (y/n):
```
Type: `y`

### Step 6: Done! 🎉
```
✅ EMAIL CONFIGURATION COMPLETE!

Check your inbox for the test email!

Next steps:
  1. Start the server: npm start
  2. Send a test JD from Srinu
  3. Watch the automation work! 🎉
```

---

## 🚀 After Email is Configured

Start the system:
```bash
npm start
```

**What happens:**
- ✅ WhatsApp connects (scan QR code first time only)
- ✅ Monitors Srinu's messages every 30 seconds
- ✅ Detects JD (messages > 200 chars)
- ✅ Auto-generates tailored resume
- ✅ Emails PDF to recruiter
- ✅ Sends you WhatsApp confirmation

---

## 🧪 Test the Full System

After starting (`npm start`), have Srinu (+91 7702055194) send you a JD like:

```
Role: Senior ML Engineer at Fiserv
Location: Dallas, TX

We're looking for an ML Engineer with Azure ML experience.
Python, Kubernetes, MLOps experience required.

Contact: recruiter@fiserv.com
```

System will:
1. Parse: "Senior ML Engineer", "Azure", "Dallas, TX", "recruiter@fiserv.com"
2. Tailor: Your resume with Azure-specific tech
3. Validate: 12 bullets, ASCII only, Azure alignment
4. Render: LaTeX → PDF
5. Email: To recruiter@fiserv.com with CC to you
6. Reply: WhatsApp confirmation ✅

---

## 📁 Important Files

| File | What It Does |
|------|--------------|
| `./setup-email.sh` | **Run this first!** Configures email |
| `test-email.js` | Test email manually |
| `test-system.sh` | Test entire system |
| `.env` | Configuration (email password goes here) |
| `EMAIL_SETUP.md` | Detailed email setup guide |
| `QUICK_START.md` | Quick start guide |
| `SYSTEM_COMPLETE.md` | Complete documentation |

---

## 🆘 If Something Goes Wrong

### Email Setup Failed?
```bash
# Check what's in .env
cat .env | grep SMTP_PASS

# Try manual test
node test-email.js

# See detailed guide
open EMAIL_SETUP.md
```

### Need 2-Step Verification?
```bash
# Open Google Security settings
open https://myaccount.google.com/security
```

### Want to do it manually?
See: `EMAIL_SETUP.md`

---

## ✅ Verification Checklist

- [ ] Ran `./setup-email.sh`
- [ ] Got Gmail App Password from Google
- [ ] Pasted password in script
- [ ] Test email sent successfully
- [ ] Received email in inbox
- [ ] Ready to run `npm start`

---

## 🎯 ONE Command to Rule Them All

```bash
./setup-email.sh && npm start
```

This will:
1. Configure email (with your help)
2. Start the server
3. You're done! 🎉

---

## 💡 Pro Tips

**Tip 1**: The setup script creates a backup of .env
- If something goes wrong, restore: `cp .env.backup .env`

**Tip 2**: You can run the test anytime
```bash
node test-email.js
```

**Tip 3**: Check server status anytime
```bash
curl http://localhost:3000/health
```

**Tip 4**: View all tools available
```bash
curl http://localhost:3000/tools
```

---

## 🎊 You're Almost There!

Just run:
```bash
./setup-email.sh
```

And you'll be fully automated in 2 minutes! 🚀

---

**Questions?** Check:
- `EMAIL_SETUP.md` - Detailed email guide
- `QUICK_START.md` - Quick start
- `SYSTEM_COMPLETE.md` - Everything about the system
