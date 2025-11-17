# 🔔 Shutdown & Power Notifications - COMPLETE GUIDE

## ✅ What's New - You Now Get Notifications For:

### 1. **System Stopped** 🛑
When you run `pm2 stop whatsapp-resume-bot`, you'll get:
```
🛑 System Stopped

⚠️ WhatsApp Resume Bot has been STOPPED

⏰ Stopped at [time]
📋 Dashboard is offline
🔍 Monitoring paused

💡 To restart, run:
pm2 start whatsapp-resume-bot
```

### 2. **Power Unplugged** 🔌
When you unplug your Mac charger:
```
🔌 Power Unplugged

⚠️ Mac is now running on BATTERY

🔋 Battery: 85%
⏰ [time]

💡 Bot will continue running until battery dies or Mac sleeps
⚡ Plug in charger to ensure 24/7 operation
```

### 3. **Power Connected** 🔌
When you plug in charger:
```
🔌 Power Connected

✅ Mac is now plugged in

🔋 Battery: 45%
⏰ [time]

✨ 24/7 operation restored!
```

### 4. **Low Battery Warning** 🚨
When battery drops below 10%:
```
🚨 LOW BATTERY WARNING

⚠️ CRITICAL: Battery at 8%!

⏰ [time]

🔌 PLUG IN CHARGER NOW!
⚡ Mac will shut down soon and bot will stop

💡 Bot will send shutdown notification before Mac dies
```

### 5. **System Started** ✅  
When bot starts (already working):
```
✅ System Started

🚀 WhatsApp Resume Bot is now LIVE!

📋 Dashboard: http://10.0.0.138:3001/approval
🔍 Monitoring Srinu for job descriptions
⏰ Checking health every 60 seconds
```

---

## 🧪 Test It Right Now!

### **Test 1: Shutdown Notification**
```bash
# Stop the bot
pm2 stop whatsapp-resume-bot

# Check your WhatsApp in 2 seconds
# You should get "🛑 System Stopped" notification!

# Start it again
pm2 start whatsapp-resume-bot

# You'll get "✅ System Started" notification
```

### **Test 2: Power Notifications** (If on battery)
```bash
# Just unplug your Mac charger
# Wait 2 minutes
# You'll get "🔌 Power Unplugged" notification

# Plug it back in
# You'll get "🔌 Power Connected" notification
```

---

## 🔋 Power Monitoring Details

### **What It Monitors:**
- ✅ Battery percentage
- ✅ Charging status (plugged in vs battery)
- ✅ Power state changes
- ✅ Low battery threshold (< 10%)

### **Check Frequency:**
- Every 2 minutes (120 seconds)
- Low battery warnings: Max once every 10 minutes

### **When You Get Alerts:**
| **Event** | **Notification** | **Frequency** |
|-----------|------------------|---------------|
| Unplug charger | 🔌 Power Unplugged | Once per event |
| Plug in charger | 🔌 Power Connected | Once per event |
| Battery < 10% | 🚨 Low Battery | Once per 10 min |
| Manual stop | 🛑 System Stopped | Once per stop |
| Manual start | ✅ System Started | Once per start |

---

## 📱 All Notifications Summary

You now get WhatsApp notifications for:

1. ✅ **System Started** - Bot comes online
2. 🛑 **System Stopped** - Bot manually stopped
3. ❌ **System Down** - Bot crashed (3 min delay)
4. ✅ **System Recovered** - Bot auto-recovered after crash
5. 🔌 **Power Unplugged** - Mac on battery
6. 🔌 **Power Connected** - Mac plugged in
7. 🚨 **Low Battery** - Battery < 10%

---

## 🎯 Complete Monitoring Coverage

### **Bot Health:**
- Health check every 60 seconds
- Down alert after 3 failures (3 minutes)
- Auto-recovery detection
- Manual stop/start notifications

### **Power/Battery:**
- Battery check every 2 minutes
- Charger connect/disconnect alerts
- Low battery warnings (< 10%)
- Critical alerts to prevent unexpected shutdowns

---

## ⚙️ Configuration

All settings in source files:

### `src/health-monitor.ts`
```typescript
HEALTH_CHECK_INTERVAL = 60000  // 60 seconds
FAILURE_THRESHOLD = 3          // 3 failures = down
```

### `src/power-monitor.ts`
```typescript
BATTERY_CHECK_INTERVAL = 120000  // 2 minutes
LOW_BATTERY_THRESHOLD = 10       // 10% battery
```

### Change notification number:
Edit `.env`:
```
MY_WHATSAPP_NUMBER=15715026464
```

---

## 🔧 Manual Commands

### **Stop (with notification):**
```bash
pm2 stop whatsapp-resume-bot
# ✅ You'll get shutdown notification
```

### **Start (with notification):**
```bash
pm2 start whatsapp-resume-bot
# ✅ You'll get startup notification
```

### **Restart (both notifications):**
```bash
pm2 restart whatsapp-resume-bot
# ✅ You'll get both shutdown + startup
```

### **Silent stop (no notification - not recommended):**
```bash
pm2 delete whatsapp-resume-bot
# ❌ No notification sent
```

---

## 🚨 Real-World Scenarios

### **Scenario 1: You Stop for Development**
```bash
pm2 stop whatsapp-resume-bot
```
**What happens:**
1. Bot sends shutdown notification
2. You get WhatsApp message within 2 seconds
3. Bot stops
4. You make your changes
5. You start again: `pm2 start whatsapp-resume-bot`
6. You get startup notification

### **Scenario 2: Laptop Battery Dies**
**What happens:**
1. At 10% battery → Low battery warning
2. At 5% battery → Another low battery warning
3. At 2% battery → Another warning
4. Mac shuts down → No notification (Mac is off)
5. You plug in and boot Mac
6. PM2 auto-starts (if configured)
7. You get startup notification

### **Scenario 3: You Unplug Charger**
**What happens:**
1. Within 2 minutes → Power unplugged notification
2. Bot continues running on battery
3. Every 2 minutes → Battery checked
4. If battery < 10% → Low battery warnings
5. You plug back in → Power connected notification

### **Scenario 4: Bot Crashes**
**What happens:**
1. PM2 auto-restarts in 2 seconds
2. Health monitor detects failure
3. After 3 failures (3 min) → Down notification
4. PM2 keeps trying to restart
5. When successful → Recovery notification

---

## ✅ Current Status

Check your WhatsApp RIGHT NOW! You should have received:

1. ✅ "System Started" notification (when we just restarted)
2. 🔌 "Power Unplugged" notification (if on battery)

Run this to check:
```bash
pm2 logs --lines 5
```

Look for:
```
📱 Sent health notification: ✅ System Started
📱 Sent power notification: 🔌 Power Unplugged (or Connected)
```

---

## 🎉 You're Fully Protected!

**Before:**
- ❌ No notification when you stopped bot
- ❌ No notification when charger unplugged
- ❌ No warning before battery dies

**Now:**
- ✅ Notification when bot stops
- ✅ Notification when charger unplugged/plugged
- ✅ Warning when battery low
- ✅ Notification when bot starts
- ✅ Notification when bot crashes/recovers

**You'll always know what's happening! 📱**

---

**Last Updated:** November 6, 2025  
**Shutdown Notifications:** ✅ ACTIVE  
**Power Monitoring:** ✅ ACTIVE  
**Battery Alerts:** ✅ ACTIVE  
