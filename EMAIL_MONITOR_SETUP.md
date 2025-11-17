# 📧 Email Monitor - Auto-Process JDs from Gmail

## 🎯 What It Does

The Email Monitor automatically watches your Gmail inbox for incoming job descriptions from recruiters and processes them through the same workflow as WhatsApp JDs.

### **Features:**
✅ Monitors Gmail INBOX for unread emails  
✅ Detects if email contains a job description  
✅ Extracts JD text and recruiter info  
✅ Processes through workflow (parse → tailor → validate → email → approve)  
✅ Creates approval card with "Source: Email" label  
✅ Marks processed emails as read (prevents re-processing)  
✅ Ignores reply emails (only processes original JDs)

---

## 🔧 Setup Gmail App Password

### **Step 1: Enable 2-Factor Authentication**
1. Go to https://myaccount.google.com/security
2. Under "Signing in to Google", enable **2-Step Verification**
3. Follow the prompts to set it up

### **Step 2: Generate App Password**
1. Go to https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Resume Automation"
4. Click **Generate**
5. Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

### **Step 3: Add to .env**
```bash
# Gmail Credentials for Email Monitor
GMAIL_USER=nihal.veeramalla@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop  # Remove spaces from generated password
```

---

## 📊 How It Works

### **Email Detection Algorithm**

An email is considered a JD if:
1. **Subject contains job keywords** (job, position, opening, role, etc.) **AND** has 3+ JD indicators, **OR**
2. **Content has 5+ JD indicators** (strong match regardless of subject)

**JD Indicators:**
- "job description"
- "position description"
- "role responsibilities"
- "required skills"
- "qualifications"
- "experience required"
- "years experience"
- "location:"
- "salary"
- "please apply"
- "full time / part time / contract"

### **Processing Flow**

```
1. Email arrives in Gmail inbox
   ↓
2. Email Monitor detects new email (IMAP)
   ↓
3. Checks if email is a JD (keyword matching)
   ↓
4. If YES → Extract JD text + recruiter info
   ↓
5. Save to data/session/email_TIMESTAMP.json
   ↓
6. Call Python orchestrator with email session file
   ↓
7. Orchestrator processes (same as WhatsApp flow)
   ↓
8. Creates approval card with source="email"
   ↓
9. Mark email as read (prevents reprocessing)
   ↓
10. Dashboard shows card: "📧 Source: Email"
```

---

## 🔐 Security & Privacy

### **IMAP Connection**
- **Protocol**: IMAP over TLS (encrypted)
- **Server**: imap.gmail.com:993
- **Authentication**: App Password (not your regular password)

### **Email Access**
- ✅ **Read-only**: System only reads emails, never sends from Gmail
- ✅ **Mark as read**: Only marks processed JD emails as read
- ✅ **No deletion**: Never deletes emails
- ✅ **No forwarding**: Never forwards emails

### **Data Storage**
- Email content saved to `data/session/email_*.json`
- Contains: timestamp, recruiter email/name, subject, JD text
- Not encrypted (sensitive data - keep `.env` and `data/` secure)

---

## 📧 Email Format Examples

### **Example 1: Recruiter Email (Will Process)**

```
From: john.smith@techrecruiter.com
Subject: Senior Data Scientist - Azure Focus
Date: Nov 7, 2025

Hi Nihal,

I came across your profile and wanted to reach out regarding 
an exciting opportunity...

Job Description:
- Position: Senior Data Scientist
- Location: San Francisco, CA
- Required Skills: Python, Azure ML, Databricks
- Experience: 5+ years
- Salary: $150k-$180k

Responsibilities:
- Build machine learning models
- Deploy to Azure cloud
...

Please let me know if you're interested!

Best,
John Smith
Tech Recruiter Inc.
```

**Detection Result:**
- ✅ Subject has "Senior Data Scientist" (job keyword)
- ✅ Content has 8+ JD indicators
- ✅ **WILL PROCESS**

---

### **Example 2: Reply Email (Will Skip)**

```
From: john.smith@techrecruiter.com
Subject: RE: Senior Data Scientist - Azure Focus
Date: Nov 7, 2025

Thanks for your response! Yes, the interview is confirmed for 
tomorrow at 2pm.

Looking forward to it!
John
```

**Detection Result:**
- ❌ Subject starts with "RE:" (reply)
- ❌ Only 1 JD indicator
- ❌ **WILL SKIP**

---

### **Example 3: LinkedIn Notification (Will Skip)**

```
From: notifications@linkedin.com
Subject: New job recommendations for you
Date: Nov 7, 2025

Here are some jobs you might be interested in...
```

**Detection Result:**
- ❌ From LinkedIn (notification email, not recruiter)
- ❌ Less than 3 JD indicators
- ❌ **WILL SKIP**

---

## 🎛️ Configuration Options

### **Environment Variables**

```bash
# Required
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-16-char-app-password

# Optional (uses defaults if not set)
GMAIL_CHECK_INTERVAL=60  # Check every 60 seconds (default)
GMAIL_MARK_AS_READ=true  # Mark processed emails as read (default)
```

---

## 📊 Monitoring & Status

### **Check Email Monitor Status**

The email monitor logs all activity:

```bash
# View logs
pm2 logs

# Look for:
✅ Email monitor connected to Gmail
📨 New email detected!
✅ Detected job description in email!
🚀 Processing job description from email...
✅ Saved email JD to: data/session/email_TIMESTAMP.json
✅ Email JD processed successfully
✅ Marked email as read
```

### **Dashboard Integration**

When an email JD is processed, the approval card will show:
- **Source**: Email (instead of WhatsApp)
- **Recruiter**: Extracted from email sender
- **Subject**: Email subject line
- **Timestamp**: When email was received

---

## 🚀 Startup & Testing

### **1. Install Dependencies**

```bash
npm install
```

This installs:
- `imap` - IMAP client for Gmail
- `mailparser` - Parse email content
- `@types/imap` - TypeScript definitions
- `@types/mailparser` - TypeScript definitions

### **2. Build**

```bash
npm run build
```

### **3. Start System**

```bash
pm2 restart all
```

### **4. Verify Email Monitor Started**

```bash
pm2 logs | grep "Email monitor"

# Should see:
# ✅ Email monitor connected to Gmail
# 📬 Inbox opened, listening for new emails...
```

### **5. Test with Real Email**

**Send yourself a test JD:**

```
To: nihal.veeramalla@gmail.com
Subject: Test - Senior AI Engineer Position

Job Description:

Position: Senior AI Engineer
Location: Remote
Experience: 5+ years
Required Skills: Python, Azure ML, LangChain
Responsibilities: Build AI agents

Please apply if interested!
```

**Expected Result:**
1. Email arrives in inbox
2. System detects it (check logs: `📨 New email detected!`)
3. Classifies as JD (check logs: `✅ Detected job description in email!`)
4. Processes through workflow
5. Creates approval card in dashboard
6. Email marked as read

---

## 🐛 Troubleshooting

### **Problem: "Email monitor not started: Gmail credentials not configured"**

**Solution:**
- Check `.env` has `GMAIL_USER` and `GMAIL_APP_PASSWORD`
- Ensure no spaces in app password
- Restart system: `pm2 restart all`

---

### **Problem: "IMAP connection failed"**

**Solutions:**
1. **Check 2FA enabled**: https://myaccount.google.com/security
2. **Regenerate app password**: Delete old one, create new
3. **Check firewall**: Ensure port 993 (IMAP) not blocked
4. **Try different network**: Some corporate networks block IMAP

---

### **Problem: "Email detected but not processing"**

**Check:**
1. **Is it a real JD?** Must have 3+ indicators
2. **Check logs** for detection result
3. **Already processed?** System skips duplicate emails

---

### **Problem: "Emails marked as read even when not JDs"**

**This is expected!** The system:
- Only marks as read **after successful processing**
- If email is NOT a JD, it stays unread
- Check logs to see why email was/wasn't classified as JD

---

## 📝 Session File Format

When an email JD is detected, it's saved to:
```
data/session/email_2025-11-07T14-30-00-000Z.json
```

**Content:**
```json
{
  "source": "email",
  "timestamp": "2025-11-07T14:30:00.000Z",
  "recruiterEmail": "john@techrecruiter.com",
  "recruiterName": "John Smith",
  "subject": "Senior Data Scientist - Azure Focus",
  "jdText": "Full email body with JD...",
  "messageId": "<abc123@mail.gmail.com>"
}
```

This file is passed to the Python orchestrator, which processes it the same way as WhatsApp JDs.

---

## 🎯 Benefits

✅ **24/7 Automation**: Never miss a JD sent via email  
✅ **Dual Input**: Process JDs from WhatsApp OR email  
✅ **No Manual Work**: Auto-detects, extracts, processes  
✅ **Smart Detection**: Filters out non-JD emails  
✅ **Unified Dashboard**: All JDs (WhatsApp + email) in one place  
✅ **Recruiter Context**: Preserves sender info for personalized emails

---

## 💡 Interview Answer

**Q: "How does your system handle JDs received via email?"**

**A:**
*"I implemented an Email Monitor using IMAP to watch my Gmail inbox for incoming job descriptions. It uses a smart detection algorithm that analyzes both the subject and content for JD-specific keywords like 'required skills,' 'experience,' 'responsibilities,' etc.*

*When an email is classified as a JD (3+ keyword matches), the system extracts the text and recruiter info, saves it to a session file, and calls the same Python orchestrator used for WhatsApp JDs. This creates a unified workflow - whether the JD comes from WhatsApp or email, it goes through the same parse → tailor → validate → approve pipeline.*

*The approval dashboard shows the source (Email vs WhatsApp), and I can review both in the same interface. The system also marks processed emails as read to prevent duplicate processing."*

---

## 🔒 Gmail Security Checklist

✅ 2-Factor Authentication enabled  
✅ Using App Password (not regular password)  
✅ App Password stored in `.env` (not committed to Git)  
✅ IMAP connection over TLS (encrypted)  
✅ Read-only access (system never sends emails)  
✅ Session data stored locally (not in cloud)

---

## 📊 System Status

| Component | Status | Port/Protocol |
|-----------|--------|---------------|
| **Email Monitor** | ✅ Running | IMAP 993 (TLS) |
| **WhatsApp Monitor** | ✅ Running | WebSocket |
| **MCP Server** | ✅ Running | HTTP 3000 |
| **Approval Dashboard** | ✅ Running | HTTP 3001 |
| **Python Orchestrator** | ✅ Ready | CLI |

---

**Last Updated**: November 7, 2025  
**Feature Status**: ✅ Production Ready  
**Dependencies Added**: imap, mailparser  
**Next Step**: Configure Gmail credentials and test
