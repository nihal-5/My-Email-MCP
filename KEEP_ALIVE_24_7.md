# 🛡️ KEEP SYSTEM ALIVE 24/7

## ✅ What's Already Configured

### 1. **PM2 Maximum Reliability Settings**
The system now has **UNLIMITED** auto-restart capability:

```javascript
✅ max_restarts: 999        // Never gives up - will restart forever
✅ restart_delay: 2000      // Quick 2-second restart
✅ autorestart: true        // Always restart on crash
✅ cron_restart: '0 3 * * *' // Daily refresh at 3 AM
✅ max_memory_restart: 500M  // Restart if memory exceeds 500MB
```

**This means:**
- If the app crashes → Restarts in 2 seconds
- If memory leaks → Restarts automatically
- Daily at 3 AM → Fresh restart to prevent issues
- Will restart 999 times if needed (basically unlimited)

---

## 🚀 CRITICAL: Enable Auto-Start on Mac Reboot

### Step 1: Run This Command ONCE
Copy and paste this EXACT command in your terminal:

```bash
sudo env PATH=$PATH:/opt/homebrew/Cellar/node/24.6.0/bin /opt/homebrew/lib/node_modules/pm2/bin/pm2 startup launchd -u nihalveeramalla --hp /Users/nihalveeramalla
```

**What it does:**
- Creates a macOS Launch Agent
- PM2 will auto-start when Mac boots
- All your processes (WhatsApp bot) will start automatically

### Step 2: Verify It's Enabled
```bash
pm2 status
# Should show: whatsapp-resume-bot | online
```

---

## 💻 Keep Mac Awake (Prevent Sleep)

### Option 1: Using `caffeinate` (Recommended)
Run this in a separate terminal and **keep it open**:

```bash
caffeinate -d
```

**What it does:**
- Prevents Mac display from sleeping
- Prevents Mac from sleeping
- Press `Ctrl+C` to stop

### Option 2: System Settings (Permanent)
1. Open **System Settings** → **Energy** (or **Battery**)
2. Under "Battery" tab:
   - Uncheck "Put hard disks to sleep when possible"
   - Set "Turn display off after" to "Never"
3. Under "Power Adapter" tab:
   - Uncheck "Put hard disks to sleep when possible"
   - Set "Turn display off after" to "Never"
   - Check "Prevent automatic sleeping when display is off"

### Option 3: Third-Party App
- Download **Amphetamine** from Mac App Store (free)
- Set it to keep Mac awake indefinitely
- More reliable than caffeinate

---

## 📊 Monitoring & Health Checks

### Check System Status
```bash
# Quick status check
pm2 status

# Live logs (see what's happening)
pm2 logs

# Monitor CPU/Memory usage
pm2 monit

# Detailed info
pm2 info whatsapp-resume-bot
```

### Dashboard URLs
- **Approval Dashboard**: http://localhost:3001/approval
- **Phone Access**: http://10.0.0.138:3001/approval
- **MCP Health Check**: http://localhost:3000/health

---

## 🔄 What Happens When...

### ❌ App Crashes
```
✅ PM2 detects crash in <1 second
✅ Waits 2 seconds
✅ Restarts the app automatically
✅ WhatsApp reconnects
✅ Monitoring resumes
```

### 💾 Mac Runs Out of Memory
```
✅ PM2 detects memory usage > 500MB
✅ Gracefully restarts the app
✅ Memory is freed
✅ App continues running
```

### 🔌 Mac Restarts/Reboots
**IF you ran the `pm2 startup` command:**
```
✅ Mac boots up
✅ PM2 starts automatically
✅ WhatsApp bot starts automatically
✅ Dashboard is accessible
```

**IF you DIDN'T run `pm2 startup`:**
```
❌ Mac boots up
❌ PM2 does NOT start
⚠️ You need to manually run: pm2 resurrect
```

### 🌐 Internet Disconnects
```
✅ WhatsApp waits for reconnection
✅ PM2 keeps app alive
✅ When internet returns, WhatsApp reconnects
✅ Monitoring resumes automatically
```

---

## ⚡ Quick Commands Reference

### Starting/Stopping
```bash
# Start system
pm2 start ecosystem.config.cjs

# Stop system
pm2 stop whatsapp-resume-bot

# Restart system
pm2 restart whatsapp-resume-bot

# Delete from PM2
pm2 delete whatsapp-resume-bot
```

### Logs & Debugging
```bash
# Live logs
pm2 logs

# Last 100 lines
pm2 logs --lines 100

# Clear logs
pm2 flush

# Only errors
pm2 logs --err
```

### Health Checks
```bash
# Check if running
pm2 status

# CPU/Memory monitor
pm2 monit

# Detailed info
pm2 info whatsapp-resume-bot

# Restart count
pm2 status | grep "↺"
```

---

## 🛡️ Maximum Uptime Checklist

- [ ] ✅ PM2 auto-restart enabled (already done)
- [ ] ✅ Saved PM2 process list (`pm2 save` - already done)
- [ ] ⏳ Run `pm2 startup` command (see Step 1 above)
- [ ] ⏳ Keep Mac awake (caffeinate or System Settings)
- [ ] ⏳ Test auto-start by rebooting Mac
- [ ] ⏳ Consider UPS (Uninterruptible Power Supply) for power outages
- [ ] ✅ Daily auto-restart at 3 AM (already configured)

---

## 🚨 Troubleshooting

### System Not Running After Reboot
```bash
# Resurrect saved processes
pm2 resurrect

# Or start fresh
pm2 start ecosystem.config.cjs
```

### Too Many Restarts
```bash
# Check logs for errors
pm2 logs --lines 50

# Check what's causing crashes
pm2 describe whatsapp-resume-bot
```

### Mac Still Going to Sleep
```bash
# Use caffeinate indefinitely
caffeinate -d &

# Check if it's running
ps aux | grep caffeinate

# Kill it if needed
pkill caffeinate
```

---

## 📈 Current Configuration

```
Process Name: whatsapp-resume-bot
Status: Online
Restarts: Unlimited (999)
Auto-restart: YES
Daily refresh: 3:00 AM
Memory limit: 500 MB
Restart delay: 2 seconds
Saved: YES
Startup: PENDING (run command above)
```

---

## 🎯 Final Steps for 100% Uptime

1. **Enable auto-start on boot:**
   ```bash
   # Run this ONCE (copy from "Step 1" above)
   sudo env PATH=$PATH:/opt/homebrew/Cellar/node/24.6.0/bin /opt/homebrew/lib/node_modules/pm2/bin/pm2 startup launchd -u nihalveeramalla --hp /Users/nihalveeramalla
   ```

2. **Keep Mac awake:**
   ```bash
   # Option A: Run in terminal (keep terminal open)
   caffeinate -d
   
   # Option B: Change System Settings (see Option 2 above)
   ```

3. **Test it:**
   ```bash
   # Reboot your Mac
   sudo reboot
   
   # After reboot, check if it auto-started
   pm2 status
   ```

---

## ✅ You're Protected Against:

- ✅ App crashes → Auto-restart in 2 seconds
- ✅ Memory leaks → Auto-restart when > 500MB
- ✅ Daily at 3 AM → Fresh restart
- ✅ Mac reboot → Auto-start (after running `pm2 startup`)
- ✅ Internet drops → Waits and reconnects
- ✅ WhatsApp session issues → Reconnects automatically

**Your system is now configured for MAXIMUM uptime! 🚀**
