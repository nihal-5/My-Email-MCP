# 🏥 Health Monitoring & WhatsApp Notifications

## ✅ What's Active NOW

Your WhatsApp Resume Bot now includes **automatic health monitoring** that sends you WhatsApp notifications!

### 📱 **You Just Received:**

```
✅ System Started

🚀 WhatsApp Resume Bot is now LIVE!

📋 Dashboard: http://10.0.0.138:3001/approval
🔍 Monitoring Srinu for job descriptions
⏰ Checking health every 60 seconds
```

Check your WhatsApp (+1 5715026464) - you should have this message!

---

## 🔔 When You'll Get Notifications

### 1. **System Started** (✅)
- When bot starts successfully
- **Just sent to you!**

### 2. **System Down** (❌)
- When bot crashes or disconnects
- After 3 consecutive failed health checks (3 minutes)
- Message includes:
  - Time of failure
  - PM2 auto-restart info
  - Manual restart command if needed

### 3. **System Recovered** (✅)
- When bot comes back online after being down
- Sent immediately when health check passes
- Confirms monitoring resumed

---

## ⚙️ How Health Monitoring Works

```
Every 60 seconds:
  ↓
Check if WhatsApp connected
  ↓
If healthy → Reset failure counter
  ↓
If unhealthy → Increment failure counter
  ↓
If 3 failures → Send "System Down" alert
  ↓
When recovered → Send "System Recovered" alert
```

### **Health Check Details:**
- ✅ Interval: Every 60 seconds
- ✅ Failure threshold: 3 consecutive failures (3 minutes)
- ✅ Auto-recovery detection: Yes
- ✅ Notifications to: +1 5715026464

---

## 📊 Example Notifications

### When System Goes Down:
```
❌ SYSTEM DOWN

🚨 WhatsApp Resume Bot is DOWN!

⏰ Detected at 11/6/2025, 4:45 PM
🔄 PM2 should auto-restart in 2 seconds
📱 You will be notified when it recovers

🛠️ If it doesn't recover, run:
pm2 restart whatsapp-resume-bot
```

### When System Recovers:
```
✅ System Recovered

🎉 WhatsApp Resume Bot is back ONLINE!

📋 Dashboard: http://10.0.0.138:3001/approval
🔍 Monitoring resumed
⏰ Downtime recovered at 11/6/2025, 4:48 PM
```

---

## 🎯 What This Means for You

### **Before** (Without Health Monitoring):
❌ Bot crashes → You don't know until you check manually
❌ Bot recovers → You don't know if it's back up
❌ No visibility into system health

### **Now** (With Health Monitoring):
✅ Bot crashes → WhatsApp notification in 3 minutes
✅ Bot recovers → WhatsApp notification immediately
✅ Full visibility via your phone

---

## 🛠️ Testing Health Monitoring

Want to test it? Here's how:

### Test 1: Manual Restart (Safe)
```bash
# This will trigger recovery notification
pm2 restart whatsapp-resume-bot

# Wait 30 seconds, you should get:
# "✅ System Started" notification
```

### Test 2: Simulate Crash (Advanced)
```bash
# Stop the bot
pm2 stop whatsapp-resume-bot

# Wait 3 minutes
# You should get "❌ SYSTEM DOWN" notification

# Start it again
pm2 start ecosystem.config.cjs

# You should get "✅ System Recovered" notification
```

---

## 📱 Notification Settings

### Your WhatsApp Number:
```
MY_WHATSAPP_NUMBER=15715026464
```

This is where all notifications go (configured in `.env`)

### Change Notification Number:
1. Edit `.env` file
2. Change `MY_WHATSAPP_NUMBER=<new-number>`
3. Rebuild: `npm run build`
4. Restart: `pm2 restart whatsapp-resume-bot`

---

## 🔧 Health Monitor Configuration

Located in: `src/health-monitor.ts`

### Current Settings:
```typescript
HEALTH_CHECK_INTERVAL = 60000      // Check every 60 seconds
FAILURE_THRESHOLD = 3              // Alert after 3 failures (3 minutes)
MY_WHATSAPP_NUMBER = "15715026464" // Your notification number
```

### To Change Settings:
1. Edit `src/health-monitor.ts`
2. Modify the constants at the top
3. Run `npm run build`
4. Run `pm2 restart whatsapp-resume-bot`

---

## 📊 Manual Status Check

Want to get a status update anytime? (Future feature - can be added)

```typescript
// Could add endpoint:
GET http://localhost:3001/send-status

// Would send you:
📊 System Status
✅ WhatsApp Resume Bot is ONLINE
⏱️ Uptime: 2h 34m
💾 Memory: 23MB
🔍 Monitoring: Active
```

---

## ✅ Current Status

```
✅ Health Monitor: ACTIVE
✅ Check Interval: 60 seconds
✅ Failure Threshold: 3 checks (3 minutes)
✅ Notifications: Enabled
✅ Your Number: +1 5715026464
✅ Startup Notification: SENT ✓
```

---

## 🚨 What to Do If You Get Alerts

### "❌ SYSTEM DOWN" Alert:

1. **Wait 2-5 minutes**: PM2 will auto-restart
2. **Check if recovered**: Look for "✅ System Recovered" notification
3. **If NOT recovered** after 5 minutes:
   ```bash
   pm2 restart whatsapp-resume-bot
   ```
4. **Still down?** Check logs:
   ```bash
   pm2 logs --lines 50
   ```

### "✅ System Recovered" Alert:

- 🎉 All good! System is back online
- No action needed
- Resume monitoring is active

---

## 📋 Summary

**You now have 24/7 visibility into your bot's health!**

✅ Automatic health checks every 60 seconds
✅ WhatsApp notifications when bot goes down
✅ WhatsApp notifications when bot recovers
✅ Startup notification (you just received it!)
✅ Works with PM2 auto-restart

**Check your WhatsApp now for the startup notification! 📱**

---

**Last Updated:** November 6, 2025
**Health Monitor:** ACTIVE
**Monitoring:** +1 5715026464
