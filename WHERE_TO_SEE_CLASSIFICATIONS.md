# 📊 WHERE TO SEE YOUR CLASSIFIED EMAILS

## 🎯 **3 PLACES TO VIEW CLASSIFICATIONS:**

---

## **1️⃣ TERMINAL (Real-Time Logs)** 

**Your current terminal shows EVERYTHING as it happens!**

### **What You'll See:**

```bash
📧 Email from: sarah@techcorp.com
   Subject: DevOps Engineer Position at TechCorp
🏷️  Classifying email with LOCAL AI (FREE!)...
✅ Email classified: JOB_OPPORTUNITY
   Confidence: 92%
   Priority: high
   Needs reply: YES
   Suggested: Generate tailored resume and reply
   💰 Cost: $0 (vs $0.10 with GPT-5)
   📊 Total savings: $0.10 (1 emails)
🚀 Processing job description...
```

**Location:** The terminal where you ran `npm start`  
**Update:** Real-time (instant)  
**Best for:** Watching classifications happen live

---

## **2️⃣ DATABASE FILE (Complete History)**

### **File Location:**
```
data/email-classifications.json
```

### **View it:**
```bash
# Pretty print with jq
cat data/email-classifications.json | jq

# Or just cat it
cat data/email-classifications.json

# Count total emails
cat data/email-classifications.json | jq 'length'

# Get all job opportunities
cat data/email-classifications.json | jq 'to_entries | map(select(.value.category == "job_opportunity"))'

# Get all newsletters
cat data/email-classifications.json | jq 'to_entries | map(select(.value.category == "newsletter"))'
```

### **What's Inside:**
```json
{
  "message-id-123": {
    "category": "job_opportunity",
    "confidence": 0.92,
    "subcategory": "recruiter_outreach",
    "sender": "Sarah Johnson <sarah@techcorp.com>",
    "subject": "DevOps Engineer Position at TechCorp",
    "priority": "high",
    "needsReply": true,
    "suggestedAction": "Generate tailored resume and reply",
    "timestamp": "2025-11-07T12:30:00.000Z"
  },
  "message-id-456": {
    "category": "newsletter",
    "confidence": 0.88,
    "sender": "TechCrunch <news@techcrunch.com>",
    "subject": "Weekly Tech Digest",
    "priority": "low",
    "needsReply": false,
    "timestamp": "2025-11-07T12:35:00.000Z"
  }
}
```

**Location:** `data/email-classifications.json`  
**Update:** After each email is classified  
**Best for:** Searching, querying, analysis

---

## **3️⃣ APPROVAL DASHBOARD (Job Opportunities Only)**

### **URL:**
```
http://localhost:3001/approval
```

### **What You See:**
- All **job opportunities** waiting for approval
- Generated resumes (PDF preview)
- Drafted emails
- Recruiter info
- One-click approve/reject buttons

### **Only Shows:**
- ✅ Job opportunities (category: `job_opportunity`)
- ❌ Does NOT show other categories (newsletters, shopping, etc.)

**Location:** http://localhost:3001/approval  
**Update:** When job emails are processed  
**Best for:** Approving/rejecting job applications

---

## 📋 **QUICK REFERENCE:**

| Location | Shows | Updates | Best For |
|----------|-------|---------|----------|
| **Terminal** | All emails | Real-time | Watching live |
| **Database File** | All emails | After each email | Searching/querying |
| **Dashboard** | Jobs only | When processed | Approving jobs |

---

## 🎬 **EXAMPLE WORKFLOW:**

### **When Email Arrives:**

**Step 1: Terminal Shows Classification**
```bash
🏷️  Classifying email with LOCAL AI (FREE!)...
✅ Email classified: JOB_OPPORTUNITY
   💰 Cost: $0
```

**Step 2: Database Updated**
```bash
cat data/email-classifications.json | tail -20
# Shows the new classification
```

**Step 3: Dashboard Updated (if job)**
```
Open: http://localhost:3001/approval
# See the new job waiting for approval
```

---

## 🔍 **HOW TO SEARCH:**

### **Find All Job Opportunities:**
```bash
cat data/email-classifications.json | jq 'to_entries | map(select(.value.category == "job_opportunity")) | map(.value)'
```

### **Find High Priority Emails:**
```bash
cat data/email-classifications.json | jq 'to_entries | map(select(.value.priority == "high")) | map(.value)'
```

### **Find Emails That Need Reply:**
```bash
cat data/email-classifications.json | jq 'to_entries | map(select(.value.needsReply == true)) | map(.value)'
```

### **Count by Category:**
```bash
cat data/email-classifications.json | jq 'to_entries | group_by(.value.category) | map({category: .[0].value.category, count: length})'
```

### **Get Today's Emails:**
```bash
cat data/email-classifications.json | jq --arg today "$(date +%Y-%m-%d)" 'to_entries | map(select(.value.timestamp | startswith($today))) | map(.value)'
```

---

## 📊 **STATISTICS:**

### **Get Complete Stats:**
```javascript
// In browser console at http://localhost:3001/approval
// Or add this as a stats endpoint

fetch('/approval/api/stats')
  .then(r => r.json())
  .then(stats => {
    console.log('Total emails:', stats.total);
    console.log('By category:', stats.categories);
    console.log('By priority:', stats.priorities);
    console.log('Need reply:', stats.needsReply);
  });
```

---

## 🎯 **RIGHT NOW:**

### **Check Current Status:**

**1. Terminal:**
```
# Look at your running terminal
# You'll see classifications happening live
```

**2. Database:**
```bash
ls -lh data/email-classifications.json
cat data/email-classifications.json | jq
```

**3. Dashboard:**
```bash
open http://localhost:3001/approval
# Or visit in browser
```

---

## 💡 **PRO TIP:**

### **Keep Terminal Visible:**
```
Split your screen:
- Left: Terminal (shows live classifications)
- Right: Browser (shows dashboard)
```

### **Watch Database Grow:**
```bash
# In another terminal
watch -n 5 'cat data/email-classifications.json | jq length'
# Updates every 5 seconds showing total count
```

### **Tail the Classifications:**
```bash
# In another terminal
tail -f logs/*.log | grep "Email classified"
```

---

## 🚀 **SEND A TEST EMAIL NOW:**

1. **Forward any email to your Gmail**
2. **Watch terminal** → See classification happen
3. **Check database** → See it stored
4. **If job** → Check dashboard

---

## 📝 **SUMMARY:**

✅ **Terminal** = Real-time watching (currently running!)  
✅ **Database** = `data/email-classifications.json` (searchable)  
✅ **Dashboard** = http://localhost:3001/approval (jobs only)

**All three are active RIGHT NOW!** 🎉

Send yourself a test email and watch it appear in all three places! 📧
