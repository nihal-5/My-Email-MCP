# WhatsApp Notification Settings

## Overview
All approval confirmations are now sent to **YOUR WhatsApp number** (+1 571-502-6464) instead of Srinu's number.

## Configuration
Set your WhatsApp number in `.env`:
```
MY_WHATSAPP_NUMBER=15715026464
```

## Notifications You'll Receive

### 1. **New Submission Created** 📋
When you submit a JD via the dashboard, you'll get:
```
📋 New Resume Ready for Approval!

Role: AI Engineer
Company: TechCorp
Cloud: GCP
Location: Remote

✅ Review at: http://localhost:3001/approval
```

### 2. **Approved & Sent** ✅
When you click "Approve & Send":
```
✅ APPROVED & SENT!

Role: AI Engineer
Company: techcorp.com
Cloud: GCP
To: recruiter@techcorp.com

Email sent successfully! 🎉
```

### 3. **Rejected** ❌
When you click "Reject":
```
❌ REJECTED

Role: AI Engineer
Cloud: GCP

You rejected this application via the dashboard.
```

### 4. **Changes Requested** 🔄
When you click "Request Changes":
```
🔄 Changes Requested

Role: AI Engineer
Comments: [Your feedback here]

Please review and resubmit.
```

## How It Works
1. When you submit a JD (manually or from Srinu), the system gets your WhatsApp chat ID
2. Format: `15715026464@c.us` (standard WhatsApp Web.js format)
3. All notifications go to this chat ID
4. Srinu will still send you JDs, but confirmations come to you only

## Notes
- **No messages sent to Srinu** about approvals/rejections
- **Only you receive confirmation messages**
- WhatsApp must be connected for notifications to work
- If WhatsApp is disconnected, you'll still see everything in the dashboard

## Date Updated
November 6, 2025
