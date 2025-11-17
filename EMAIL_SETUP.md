# 📧 Gmail Configuration - Complete Guide

## 🚀 Super Easy Setup (2 Commands!)

```bash
cd /Users/nihalveeramalla/projects/agentkit
./setup-email.sh
```

That's it! The script will:
1. ✅ Open Gmail App Password page in your browser
2. ✅ Guide you through getting the password
3. ✅ Automatically update your `.env` file
4. ✅ Test the email configuration
5. ✅ Confirm everything works!

---

## 📋 Manual Setup (If You Prefer)

### Step 1: Get Gmail App Password

1. **Open this link**: https://myaccount.google.com/apppasswords

2. **Sign in** to your Google account

3. **You'll see this page**:
   ```
   App passwords

   Select the app and device you want to generate the app password for.

   Select app: [Mail ▼]
   Select device: [Other (Custom name) ▼]
   ```

4. **Select**:
   - App: **Mail**
   - Device: **Other (Custom name)**

5. **Type**: `Resume Automation`

6. **Click**: `Generate`

7. **Copy the password**:
   ```
   Your app password for your device

   abcd efgh ijkl mnop    [📋 Copy icon]
   ```

   ⚠️ **Important**: Save this password! You won't see it again.

### Step 2: Update .env File

Open your `.env` file:
```bash
cd /Users/nihalveeramalla/projects/agentkit
nano .env
```

Find this line:
```bash
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE
```

Replace with your password (remove spaces):
```bash
SMTP_PASS=abcdefghijklmnop
```

**Before:**
```bash
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE
```

**After:**
```bash
SMTP_PASS=abcdefghijklmnop
```

Save and exit:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

### Step 3: Test It

```bash
node test-email.js
```

**Success looks like:**
```
========================================
Testing Email Configuration
========================================

Configuration:
  SMTP Host: smtp.gmail.com
  SMTP Port: 587
  SMTP User: nihal.veeramalla@gmail.com
  From Email: nihal.veeramalla@gmail.com
  SMTP Pass: ✅ Set (hidden)

Creating transporter...
Verifying SMTP connection...
✅ SMTP connection successful!

Sending test email...
✅ Test email sent successfully!
   Message ID: <abc123@gmail.com>

========================================
✅ EMAIL CONFIGURATION SUCCESSFUL!
========================================

Check your inbox for the test email.
Your system is ready to send resumes! 🎉
```

Check your Gmail inbox - you should see a test email! 📬

---

## ❓ FAQ: Getting Gmail App Password

### Q: I don't see "App passwords" option
**A**: You need to enable **2-Step Verification** first:
1. Go to: https://myaccount.google.com/security
2. Find "2-Step Verification" → Click "Get Started"
3. Follow the steps
4. Then you'll see "App passwords"

### Q: Do I need 2-Step Verification?
**A**: Yes! Gmail requires it for App Passwords. It's more secure anyway! 🔒

### Q: Can I use my regular Gmail password?
**A**: No, you must use an App Password for security reasons.

### Q: Will this affect my regular Gmail?
**A**: No! App Passwords are separate. Your regular Gmail works normally.

### Q: Can I revoke this password later?
**A**: Yes! Go to https://myaccount.google.com/apppasswords and delete it anytime.

---

## 🐛 Troubleshooting

### ❌ Error: "Invalid login: 535-5.7.8"

**Problem**: Wrong password or 2-Step Verification not enabled

**Solution**:
```bash
# 1. Enable 2-Step Verification
open https://myaccount.google.com/signinoptions/two-step-verification

# 2. Generate NEW App Password
open https://myaccount.google.com/apppasswords

# 3. Update .env with new password
nano .env

# 4. Test again
node test-email.js
```

### ❌ Error: "ECONNREFUSED"

**Problem**: Network blocking SMTP

**Solution**:
- Check internet connection
- Try disabling VPN
- Check firewall settings

### ⚠️ Password has spaces in it

**Problem**: You copied the password with spaces

**Solution**: Remove all spaces from the password
- `abcd efgh ijkl mnop` → `abcdefghijklmnop`

---

## ✅ Verification Checklist

Before starting the server, verify:

- [ ] 2-Step Verification is enabled on Gmail
- [ ] Generated App Password from Google
- [ ] Updated `.env` file with the password (no spaces)
- [ ] Ran `node test-email.js` successfully
- [ ] Received test email in inbox
- [ ] Ready to start: `npm start`

---

## 🎯 Quick Reference

### URLs You Need
```
2-Step Verification: https://myaccount.google.com/signinoptions/two-step-verification
App Passwords:       https://myaccount.google.com/apppasswords
```

### Commands You Need
```bash
# Automated setup (recommended)
./setup-email.sh

# Test email
node test-email.js

# Edit .env manually
nano .env

# Check .env is correct
cat .env | grep SMTP_PASS
```

### .env Configuration
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=nihal.veeramalla@gmail.com
SMTP_PASS=your16charpassword
FROM_EMAIL=nihal.veeramalla@gmail.com
CC_EMAIL=nihal.veeramalla@gmail.com
```

---

## 🎉 After Email Works

Once email is configured and tested:

```bash
# Start the server
npm start

# System is now:
✅ Monitoring WhatsApp for JDs from Srinu
✅ Auto-generating tailored resumes
✅ Sending PDFs to recruiters via email
✅ CCing you on every email
✅ Replying on WhatsApp with status
```

---

## 🆘 Still Need Help?

Run the automated setup script - it handles everything:
```bash
./setup-email.sh
```

Or check the complete documentation:
- `QUICK_START.md` - Quick start guide
- `SYSTEM_COMPLETE.md` - Full system documentation

---

## 🔐 Security Notes

✅ **App Passwords are secure** - They're designed for this purpose
✅ **Limited scope** - Only works for email, not full account access
✅ **Revocable** - Delete anytime from Google Account
✅ **Stored locally** - Never sent anywhere except Gmail SMTP
✅ **In .gitignore** - Won't be committed to git

Your Gmail is safe! 🔒
