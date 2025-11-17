# 🎯 How to Use the Approval System

## 🎉 System Complete!

Your resume automation now has a **beautiful approval dashboard** where you review and approve every resume before it's sent to recruiters!

---

## 🚀 Quick Start (3 Steps)

### Step 1: Start the Server
```bash
cd /Users/nihalveeramalla/projects/agentkit
npm start
```

You'll see:
```
✅ WhatsApp MCP Server is running!

MCP Server listening on port 3000
Approval Dashboard: http://localhost:3001/approval

📋 Approval Dashboard:
  🌐 http://localhost:3001/approval
  Review and approve resumes before sending to recruiters
```

### Step 2: Open the Dashboard
Open in your browser:
```
http://localhost:3001/approval
```

### Step 3: Test It!
Send a test JD from Srinu or run manual test:
```bash
export JD_TEXT="Role: ML Engineer at Fiserv\nAzure ML, Python\nContact: test@example.com"
export TO_EMAIL="nihal.veeramalla@gmail.com"
python3 orchestrator/main.py
```

---

## 📱 Complete Workflow

### What Happens Automatically

```
1. Srinu sends JD via WhatsApp
   ↓
2. System detects (30 sec polling)
   ↓
3. Processes JD:
   - Parse → Extract role, cloud, location, recruiter
   - Tailor → Customize resume for cloud
   - Validate → Check rules (12/8/5 bullets, ASCII, etc.)
   - Generate PDF → LaTeX compiled
   ↓
4. ⏸️  PAUSES - Submitted to approval queue
   ↓
5. You get WhatsApp notification:
   "📋 Resume ready for your approval!

    Role: ML Engineer
    Cloud: Azure
    Location: Dallas, TX

    Review at: http://localhost:3001/approval"
   ↓
6. You open dashboard in browser
   ↓
7. You see the submission with:
   - Role, cloud, location details
   - [📄 View PDF] button
   - [📧 Preview Email] button
   - [✅ Approve] [🔄 Request Changes] [❌ Reject]
   ↓
8. You make a decision...
```

---

## 🎨 Dashboard Features

### View Resume (Click "📄 View PDF")
- Opens PDF in new tab
- Full-screen, zoomable
- See exactly what recruiter will receive

### Preview Email (Click "📧 Preview Email")
- Modal shows:
  - **To**: recruiter@fiserv.com
  - **CC**: nihal.veeramalla@gmail.com
  - **Subject**: Application – ML Engineer – Nihal Veeramalla
  - **Body**: Full email text

### Approve (Click "✅ Approve & Send")
- Confirm: "Send this resume to the recruiter?"
- Email sent immediately
- WhatsApp confirmation:
  ```
  ✅ Resume APPROVED and sent!

  Role: ML Engineer
  Cloud: Azure
  To: recruiter@fiserv.com
  PDF: ./outbox/Nihal_Veeramalla_Resume_2025-01-05.pdf
  ```

### Request Changes (Click "🔄 Request Changes")
- Modal pops up
- You type specific changes:
  ```
  - Reduce Fiserv bullets from 12 to 10
  - Focus more on Azure ML
  - Add Kubernetes experience in Hyperleap section
  ```
- System sends WhatsApp to Srinu:
  ```
  🔄 Changes requested for resume

  Role: ML Engineer

  Comments:
  - Reduce Fiserv bullets from 12 to 10
  - Focus more on Azure ML
  - Add Kubernetes experience

  Please regenerate with these changes.
  ```

### Reject (Click "❌ Reject")
- Confirm: "Reject this submission?"
- Resume NOT sent
- Removed from dashboard
- WhatsApp notification:
  ```
  ❌ Resume REJECTED

  Role: ML Engineer
  Reason: Manually rejected via dashboard
  ```

---

## 📊 Dashboard Layout

```
╔════════════════════════════════════════════════════╗
║ 📋 Resume Approval Dashboard                      ║
║ Review and approve resumes before sending         ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📊 STATS                                          ║
║  ┌─────────────┬─────────────┬─────────────┐      ║
║  │ Pending: 2  │ Approved: 5 │ Total: 7    │      ║
║  └─────────────┴─────────────┴─────────────┘      ║
║                                                    ║
╠════════════════════════════════════════════════════╣
║  Pending Approvals                                 ║
╠════════════════════════════════════════════════════╣
║                                                    ║
║  📋 Senior ML Engineer                             ║
║  2025-01-05 14:30  [AZURE] [PENDING]              ║
║                                                    ║
║  Location: Dallas, TX                              ║
║  Recruiter: recruiter@fiserv.com                   ║
║  Subject: Application – Senior ML Engineer...     ║
║                                                    ║
║  [📄 View PDF] [📧 Preview Email]                  ║
║  [✅ Approve & Send] [🔄 Request Changes] [❌ Reject]║
║                                                    ║
╠════════════════════════════════════════════════════╣
║  (auto-refreshes every 10 seconds)                 ║
╚════════════════════════════════════════════════════╝
```

---

## 🧪 Testing Scenarios

### Test 1: Approve Immediately
```bash
# Terminal 1: Start server
npm start

# Terminal 2: Submit test
export JD_TEXT="Role: ML Engineer\nAzure ML\nContact: test@gmail.com"
python3 orchestrator/main.py

# Browser: Open http://localhost:3001/approval
# 1. See submission
# 2. Click "View PDF" - looks good
# 3. Click "Approve & Send"
# 4. Email sent! ✅
```

### Test 2: Request Changes
```bash
# Same setup as Test 1
# Browser:
# 1. Click "Request Changes"
# 2. Type: "Make resume 1 page only"
# 3. Submit
# 4. Check WhatsApp for notification to Srinu
```

### Test 3: Reject
```bash
# Same setup as Test 1
# Browser:
# 1. Click "Reject"
# 2. Confirm
# 3. Submission removed from dashboard
```

### Test 4: Real JD from Srinu
```bash
# Terminal: Server running
npm start

# WhatsApp: Srinu sends JD
"Role: Senior ML Engineer at Fiserv..."

# Wait 30 seconds (next poll)
# Check console logs - see processing
# Get WhatsApp notification
# Open dashboard
# Review and approve!
```

---

## 🔔 Notifications You Get

### 1. New Submission
```
📋 Resume ready for your approval!

Role: Senior ML Engineer
Cloud: Azure
Location: Dallas, TX

Review at: http://localhost:3001/approval
```

### 2. Approved
```
✅ Resume APPROVED and sent!

Role: Senior ML Engineer
Cloud: Azure
To: recruiter@fiserv.com
PDF: ./outbox/Nihal_Veeramalla_Resume_2025-01-05.pdf
```

### 3. Changes Requested
```
🔄 Changes requested for resume

Role: Senior ML Engineer

Comments:
[Your comments here]

Please regenerate with these changes.
```

### 4. Rejected
```
❌ Resume REJECTED

Role: Senior ML Engineer
Reason: Manually rejected via dashboard
```

---

## 📁 Files & Locations

| What | Where |
|------|-------|
| **Dashboard URL** | http://localhost:3001/approval |
| **MCP Server** | http://localhost:3000 |
| **Approval Queue** | `/Users/nihalveeramalla/projects/agentkit/data/approval-queue.json` |
| **Generated PDFs** | `/Users/nihalveeramalla/projects/agentkit/outbox/` |
| **Config** | `.env` → `APPROVAL_PORT=3001` |

---

## 💡 Pro Tips

**Tip 1**: Keep dashboard open in a tab
- Auto-refreshes every 10 seconds
- You'll see new submissions immediately

**Tip 2**: Always preview PDF before approving
- Click "View PDF" to see exact formatting
- Check bullet counts, spacing, alignment

**Tip 3**: Preview email for tone
- Click "Preview Email"
- Verify recruiter name is correct
- Check email sounds professional

**Tip 4**: Be specific with change requests
- ✅ Good: "Reduce Fiserv bullets from 12 to 10, add more Kubernetes"
- ❌ Bad: "Make it better"

**Tip 5**: Bookmark the dashboard
```
http://localhost:3001/approval
```

---

## 🎯 Typical Daily Workflow

### Morning
```bash
cd /Users/nihalveeramalla/projects/agentkit
npm start

# Open dashboard in browser
open http://localhost:3001/approval

# Leave both running all day
```

### When JD Arrives
1. ⏰ Wait ~30 seconds (automatic processing)
2. 📱 Get WhatsApp: "Resume ready for approval!"
3. 🌐 Check dashboard (already open)
4. 📄 View PDF → Preview Email
5. ✅ Approve (or request changes)
6. 📧 Email sent to recruiter!

### End of Day
- Check `./outbox/` for all PDFs sent today
- Review approval queue: http://localhost:3001/approval
- Server can stay running or Ctrl+C to stop

---

## 🔧 Customization

### Change Dashboard Port
Edit `.env`:
```bash
APPROVAL_PORT=3001  # Change to any port
```

### Change Approval Message
Edit `src/approval-server.ts` line ~XXX (search for "Resume ready for approval")

### Add More Stats
Edit `src/approval-server.ts` dashboard HTML section

---

## ❓ FAQs

**Q: What if I miss the WhatsApp notification?**
A: Just open the dashboard - submissions stay there until you approve/reject

**Q: Can I approve from my phone?**
A: Not yet, dashboard is desktop-only for now

**Q: What happens if server crashes?**
A: Approval queue is saved to disk. Just restart and submissions are still there

**Q: Can I edit the resume in the dashboard?**
A: Not directly. Use "Request Changes" to ask for modifications

**Q: How do I see past approvals?**
A: Check `./outbox/` folder for all generated PDFs

**Q: Can I batch approve multiple?**
A: Not yet, each requires individual review (intentional for quality)

---

## 🎊 You're Ready!

Your approval system is **fully operational**!

**Next:**
1. Start server: `npm start`
2. Open dashboard: http://localhost:3001/approval
3. Send test JD (or wait for real one from Srinu)
4. Review, preview, approve!

**Enjoy your new superpower:** Complete control over every resume sent! 🚀

---

## 📞 Commands Reference

```bash
# Start everything
npm start

# Open dashboard
open http://localhost:3001/approval

# Test manually
export JD_TEXT="Role: ML Engineer\nAzure\nContact: test@gmail.com"
python3 orchestrator/main.py

# Check queue file
cat data/approval-queue.json | jq

# View PDFs
ls -lah outbox/

# Check server status
curl http://localhost:3000/health
curl http://localhost:3001/approval/api/pending
```

---

**Documentation:**
- This file: `HOW_TO_USE_APPROVAL.md`
- System overview: `APPROVAL_SYSTEM.md`
- Complete docs: `SYSTEM_COMPLETE.md`
