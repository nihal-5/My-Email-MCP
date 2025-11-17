# GitHub Secrets Setup - Quick Guide

## 📋 How to Add Secrets to GitHub

### Step-by-Step:

1. **Go to your GitHub repository**
   - Open https://github.com/YOUR_USERNAME/agentkit

2. **Navigate to Settings**
   - Click **Settings** tab (top right)

3. **Go to Secrets**
   - Left sidebar → **Secrets and variables** → **Actions**

4. **Add each secret**
   - Click **New repository secret**
   - Enter **Name** (exactly as shown below)
   - Enter **Secret** (the actual value)
   - Click **Add secret**

---

## 🔑 Required Secrets Checklist

Copy this checklist and check off as you add each one:

### Oracle Cloud Connection
- [ ] `ORACLE_HOST` = Your Oracle Cloud public IP (e.g., `123.45.67.89`)
- [ ] `ORACLE_USERNAME` = `ubuntu` (default for Oracle Cloud)
- [ ] `ORACLE_SSH_KEY` = Content of your SSH private key file
- [ ] `ORACLE_PORT` = `22` (can be omitted, defaults to 22)

### WhatsApp
- [ ] `MY_WHATSAPP_NUMBER` = Your WhatsApp number with country code (e.g., `15715026464`)

### Email (SMTP)
- [ ] `SMTP_HOST` = `smtp.gmail.com`
- [ ] `SMTP_PORT` = `587`
- [ ] `SMTP_USER` = Your Gmail address
- [ ] `SMTP_PASS` = Your Gmail App Password (NOT your regular password!)
- [ ] `FROM_EMAIL` = Same as SMTP_USER
- [ ] `TO_EMAIL` = Where to send resumes (can be same as SMTP_USER)
- [ ] `CC_EMAIL` = Optional CC recipient

### AI Services (Choose at least one)
- [ ] `HUGGINGFACE_API_KEY` = Your Hugging Face API key (FREE!)
- [ ] `GROQ_API_KEY` = Your Groq API key (FREE!)
- [ ] `OPENAI_API_KEY` = Your OpenAI API key (Paid, optional)

### Security
- [ ] `SESSION_SECRET` = Random string (generate: `openssl rand -base64 32`)

---

## 📝 How to Get Each Secret

### 1. ORACLE_HOST
```bash
# This is your Oracle Cloud instance's public IP
# Find it in Oracle Cloud Console:
# Compute → Instances → Your Instance → Public IP Address
# Example: 123.45.67.89
```

### 2. ORACLE_SSH_KEY
```bash
# Display your private key:
cat ~/.ssh/oracle_cloud_key

# Copy EVERYTHING including:
# -----BEGIN RSA PRIVATE KEY-----
# [all the lines]
# -----END RSA PRIVATE KEY-----

# Paste into GitHub Secret
```

### 3. MY_WHATSAPP_NUMBER
```
# Format: Country code + number (NO spaces, dashes, or +)
# USA: 15715026464
# India: 919876543210
# UK: 447123456789
```

### 4. Gmail App Password
```
1. Go to: https://myaccount.google.com/apppasswords
2. Sign in to your Google Account
3. Select app: "Mail"
4. Select device: "Other" → Type "WhatsApp Bot"
5. Click "Generate"
6. Copy the 16-character password (remove spaces)
7. Use this as SMTP_PASS (NOT your regular Gmail password!)
```

### 5. HUGGINGFACE_API_KEY (FREE!)
```
1. Go to: https://huggingface.co/settings/tokens
2. Sign up/login (free account)
3. Click "New token"
4. Name: "WhatsApp Resume Bot"
5. Type: "Read"
6. Click "Generate"
7. Copy the token (starts with hf_)
```

### 6. GROQ_API_KEY (FREE!)
```
1. Go to: https://console.groq.com/keys
2. Sign up/login (free account)
3. Click "Create API Key"
4. Name: "WhatsApp Resume Bot"
5. Copy the key (starts with gsk_)
```

### 7. SESSION_SECRET
```bash
# On Mac/Linux, run:
openssl rand -base64 32

# Copy the output (random string)
# Example: kJ8s9d2FpL3mN5qR7tV9wX2zA4bC6dE8fG0hI2jK4lM6=
```

---

## ✅ Verification Checklist

After adding all secrets:

1. **Count secrets:**
   - GitHub → Settings → Secrets and variables → Actions
   - You should have 14-16 secrets (depending on optional ones)

2. **Names must match exactly:**
   - `ORACLE_HOST` ✅
   - `oracle_host` ❌ (wrong case)
   - `ORACLE HOST` ❌ (no spaces)

3. **SSH key format:**
   - Must include `-----BEGIN RSA PRIVATE KEY-----`
   - Must include `-----END RSA PRIVATE KEY-----`
   - No extra blank lines at start/end

4. **Test deployment:**
   - Push a small change to trigger GitHub Actions
   - Watch the Actions tab for success/failure

---

## 🔍 Common Issues

### Issue: GitHub Actions fails with "Permission denied (publickey)"
**Solution:** 
- Check `ORACLE_SSH_KEY` format
- Ensure entire key is copied (including BEGIN/END lines)
- Verify `ORACLE_USERNAME` is correct (usually `ubuntu`)

### Issue: Email not sending
**Solution:**
- Use Gmail App Password, not regular password
- Enable 2FA on Gmail first (required for app passwords)
- Check `SMTP_PASS` has no spaces

### Issue: AI customization not working
**Solution:**
- Verify at least one API key is set (HUGGINGFACE or GROQ)
- Check API key is valid (no typos)
- Test key at provider's website first

### Issue: WhatsApp notifications not received
**Solution:**
- Check `MY_WHATSAPP_NUMBER` format (no +, spaces, or dashes)
- Ensure number includes country code
- Example: USA = `15715026464`, not `+1 571 502 6464`

---

## 🎯 Quick Test

After setting up secrets, test with a small change:

```bash
# Make a small change
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test: GitHub Actions deployment"
git push origin main

# Watch deployment:
# GitHub → Actions tab → Watch workflow run
```

If successful, you'll see:
- ✅ Green checkmark
- Container running on Oracle Cloud
- Dashboard accessible at http://YOUR_ORACLE_IP:3001/approval

---

## 📚 Reference

**GitHub Secrets Documentation:**
https://docs.github.com/en/actions/security-guides/encrypted-secrets

**This project's workflow file:**
`.github/workflows/deploy.yml`

**Environment template:**
`.env.example`

---

**Done?** Go back to `GIT_AND_CICD_SETUP.md` for the complete workflow guide!
