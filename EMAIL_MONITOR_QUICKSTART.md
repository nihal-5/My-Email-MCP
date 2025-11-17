# 🚀 QUICK START: Email Monitor

## ⚡ 5-Minute Setup

### **Step 1: Generate Gmail App Password** (2 minutes)

1. **Enable 2FA** (if not already):
   - Visit: https://myaccount.google.com/security
   - Click "2-Step Verification" → Follow prompts

2. **Create App Password**:
   - Visit: https://myaccount.google.com/apppasswords
   - App: **Mail**
   - Device: **Other** → Type "Resume Automation"
   - Click **Generate**
   - **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)

---

### **Step 2: Add to .env** (1 minute)

Open `/Users/nihalveeramalla/projects/agentkit/.env` and add:

```bash
# Email Monitor Configuration
GMAIL_USER=nihal.veeramalla@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop  # Remove spaces from generated password
```

**Important**: Remove ALL spaces from the app password!

---

### **Step 3: Restart System** (1 minute)

```bash
pm2 restart all
```

---

### **Step 4: Verify** (1 minute)

Check logs:
```bash
pm2 logs | grep "Email monitor"
```

**Should see:**
```
✅ Email monitor connected to Gmail
📬 Inbox opened, listening for new emails...
```

**If you see error:**
```
❌ Email monitor not started: Gmail credentials not configured
```
→ Check `.env` has `GMAIL_USER` and `GMAIL_APP_PASSWORD` (no typos, no spaces)

---

### **Step 5: Test** (5 minutes)

**Send yourself a test email:**

```
From: your-email@gmail.com
To: nihal.veeramalla@gmail.com
Subject: Test - Senior AI Engineer Position

Job Description:

Position: Senior AI Engineer
Company: TechCorp Inc.
Location: Remote (US)
Type: Full-time
Salary: $150k-$180k

Required Skills:
- Python programming
- Azure ML, Databricks
- 5+ years experience
- Machine Learning expertise

Responsibilities:
- Build AI agents
- Deploy ML models
- Work with stakeholders

Please apply if interested!

Contact: recruiter@techcorp.com
```

**Expected Behavior:**
1. Email arrives in Gmail
2. System detects: `📨 New email detected!`
3. Classifies as JD: `✅ Detected job description in email!`
4. Processes: `🚀 Processing job description from email...`
5. Creates card in dashboard: http://localhost:3001/approval
6. Email marked as READ

---

## ✅ Success Checklist

- [ ] Gmail App Password generated
- [ ] Added to `.env` (no spaces in password)
- [ ] System restarted (`pm2 restart all`)
- [ ] Logs show "Email monitor connected"
- [ ] Test email sent
- [ ] Dashboard shows card with "📧 Source: Email"

---

## 🐛 Common Issues

### **Problem: "No logs about email monitor"**
**Solution**: Check if credentials are set
```bash
cat .env | grep GMAIL
```
Should show:
```
GMAIL_USER=nihal.veeramalla@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
```

---

### **Problem: "Email monitor not started"**
**Solutions**:
1. Check 2FA is enabled on Gmail
2. Regenerate app password (delete old one first)
3. Remove ALL spaces from password in `.env`
4. Restart: `pm2 restart all`

---

### **Problem: "Email not detected as JD"**
**Solution**: Check if email has enough indicators
- Subject should mention: job, position, opening, etc.
- Content should have: required skills, responsibilities, experience, etc.
- Need 3+ indicators minimum

---

## 📊 Dashboard Example

After test email processes, dashboard will show:

```
┌─────────────────────────────────────────┐
│ 📧 Senior AI Engineer                    │
│                                          │
│ Source: Email                            │
│ Recruiter: recruiter@techcorp.com       │
│ Cloud: Azure                             │
│ Location: Remote (US)                    │
│ Timestamp: Nov 7, 2025 2:30 PM         │
│                                          │
│ [View Resume] [Edit Email] [Approve]    │
└─────────────────────────────────────────┘
```

---

## 🎯 You're Done!

System now monitors:
✅ **WhatsApp** messages from Srinu  
✅ **Gmail inbox** for recruiter emails

Both create cards in the same dashboard for unified management!

---

**Need Help?** Check full docs: `EMAIL_MONITOR_SETUP.md`
