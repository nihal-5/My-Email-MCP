# Git and CI/CD Setup Guide

Complete guide for setting up Git workflow, environment management, and automated deployments with GitHub Actions.

---

## 📋 Table of Contents

1. [Environment Setup](#environment-setup)
2. [Git Workflow](#git-workflow)
3. [GitHub Actions CI/CD](#github-actions-cicd)
4. [Deployment Process](#deployment-process)

---

## 🔧 Environment Setup

### Development vs Production

The project supports separate configurations for development and production:

**Development (Local Mac)**
- Use `docker-compose.dev.yml` or PM2
- Debug logging enabled
- Hot reload for code changes
- Localhost only

**Production (Oracle Cloud)**
- Use `docker-compose.prod.yml`
- Production logging
- Auto-restart always enabled
- Public IP accessible

### Setting Up Your Environment

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Fill in your actual values:**
   ```bash
   nano .env
   # or
   code .env
   ```

3. **Required variables:**
   - `MY_WHATSAPP_NUMBER` - Your WhatsApp number
   - `SMTP_*` - Your Gmail app password
   - `HUGGINGFACE_API_KEY` or `GROQ_API_KEY` - AI API key
   - `SESSION_SECRET` - Generate with: `openssl rand -base64 32`

4. **Never commit .env:**
   ```bash
   # Already in .gitignore, but double-check:
   git status  # Should NOT show .env
   ```

---

## 🌳 Git Workflow

### Initial Setup

```bash
# Initialize repository (if not done)
git init

# Add all files
git add .

# First commit
git commit -m "Initial commit: WhatsApp Resume Automation"

# Add remote (replace with your GitHub repo)
git remote add origin https://github.com/YOUR_USERNAME/agentkit.git

# Push to GitHub
git push -u origin main
```

### Daily Development Workflow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create a feature branch (optional)
git checkout -b feature/new-feature

# 3. Make your changes
# ... edit code ...

# 4. Test locally
npm run build
pm2 start ecosystem.config.cjs
# or
docker-compose -f docker-compose.dev.yml up

# 5. Stage and commit
git add .
git commit -m "Add: Description of changes"

# 6. Push to GitHub
git push origin main
# or if on feature branch:
git push origin feature/new-feature
```

### Commit Message Conventions

```bash
# Feature additions
git commit -m "Add: New email notification feature"

# Bug fixes
git commit -m "Fix: WhatsApp authentication issue"

# Updates
git commit -m "Update: AI customization prompt"

# Configuration changes
git commit -m "Config: Update Docker compose for production"

# Documentation
git commit -m "Docs: Add deployment guide"
```

### What NOT to Commit

The `.gitignore` file automatically excludes:

- ✅ `.env` files (contains secrets!)
- ✅ `node_modules/` (dependencies)
- ✅ `data/` (WhatsApp sessions)
- ✅ `dist/` (build output)
- ✅ `outbox/` (generated PDFs)
- ✅ `.wwebjs_*` (WhatsApp cache)
- ✅ SSH keys (`.pem`, `.key`)

**Always check before committing:**
```bash
git status  # Review what will be committed
git diff    # See actual changes
```

---

## 🚀 GitHub Actions CI/CD

### Overview

GitHub Actions automatically deploys to Oracle Cloud when you push to `main` branch.

**Workflow:** `Local Changes` → `Git Push` → `GitHub Actions` → `Oracle Cloud Deployment`

### Setting Up GitHub Secrets

1. **Go to your GitHub repository**
2. **Settings** → **Secrets and variables** → **Actions**
3. **Click "New repository secret"**
4. **Add these secrets:**

#### Required Secrets

| Secret Name | Description | Example |
|------------|-------------|---------|
| `ORACLE_HOST` | Oracle Cloud public IP | `123.45.67.89` |
| `ORACLE_USERNAME` | SSH username (usually `ubuntu`) | `ubuntu` |
| `ORACLE_SSH_KEY` | Private SSH key content | Paste entire `.pem` file |
| `ORACLE_PORT` | SSH port (optional, default 22) | `22` |
| `MY_WHATSAPP_NUMBER` | Your WhatsApp number | `15715026464` |
| `SMTP_HOST` | SMTP server | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | Email address | `your@gmail.com` |
| `SMTP_PASS` | Gmail app password | `abcd efgh ijkl mnop` |
| `FROM_EMAIL` | Sender email | `your@gmail.com` |
| `TO_EMAIL` | Recipient email | `your@gmail.com` |
| `CC_EMAIL` | CC email | `manager@company.com` |
| `HUGGINGFACE_API_KEY` | Hugging Face API key | `hf_xxxxx` |
| `GROQ_API_KEY` | Groq API key (optional) | `gsk_xxxxx` |
| `OPENAI_API_KEY` | OpenAI API key (optional) | `sk-xxxxx` |
| `SESSION_SECRET` | Session secret | Generated string |

#### How to Get SSH Key Content

```bash
# On your Mac, display your Oracle Cloud SSH key:
cat ~/.ssh/oracle_cloud_key

# Copy the ENTIRE output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... all the content ...
# -----END RSA PRIVATE KEY-----

# Paste this into ORACLE_SSH_KEY secret
```

### Triggering Deployments

**Automatic deployment on every push:**
```bash
git add .
git commit -m "Update: New feature"
git push origin main
# ⚡ GitHub Actions automatically deploys!
```

**Manual deployment from GitHub:**
1. Go to your repo on GitHub
2. Click **Actions** tab
3. Click **Deploy to Oracle Cloud** workflow
4. Click **Run workflow** button
5. Select branch (main)
6. Click **Run workflow**

### Monitoring Deployments

**View deployment status:**
1. Go to **Actions** tab in GitHub
2. Click on the running workflow
3. Watch real-time logs
4. See deployment status

**Check logs:**
- ✅ Green checkmark = Deployment successful
- ❌ Red X = Deployment failed (click to see error)
- 🟡 Yellow dot = Deployment in progress

---

## 📦 Deployment Process

### Local Development

**Option 1: PM2 (Recommended for Mac)**
```bash
# Build
npm run build

# Start
pm2 start ecosystem.config.cjs

# Monitor
pm2 status
pm2 logs

# Stop
pm2 stop all
```

**Option 2: Docker Development**
```bash
# Start
docker-compose -f docker-compose.dev.yml up -d

# Logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop
docker-compose -f docker-compose.dev.yml down
```

### Production Deployment

**Automated (via GitHub Actions):**
```bash
# Just push to main!
git push origin main
```

**Manual (SSH to Oracle Cloud):**
```bash
# SSH into server
ssh -i ~/.ssh/oracle_cloud_key ubuntu@YOUR_ORACLE_IP

# Navigate to project
cd ~/agentkit

# Pull latest
git pull origin main

# Deploy
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs --tail=50
```

### Environment-Specific Commands

```bash
# Development
docker-compose -f docker-compose.dev.yml [command]

# Production
docker-compose -f docker-compose.prod.yml [command]

# Local testing (default docker-compose.yml)
docker-compose [command]
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Use `.env.example` as template
- ✅ Store secrets in GitHub Secrets
- ✅ Use SSH keys for Oracle Cloud
- ✅ Generate strong `SESSION_SECRET`
- ✅ Use Gmail App Passwords (not your real password)
- ✅ Review `.gitignore` regularly

### ❌ DON'T:
- ❌ Commit `.env` file
- ❌ Share API keys publicly
- ❌ Use real Gmail password
- ❌ Commit SSH keys
- ❌ Push sensitive data

### Checking for Secrets

```bash
# Before committing, check for secrets:
git diff | grep -i "api_key\|password\|secret\|token"

# If found, DON'T commit! Move to .env instead
```

---

## 🆘 Troubleshooting

### GitHub Actions Fails

```bash
# Check secrets are set:
# GitHub → Settings → Secrets → Check all required secrets exist

# Check SSH key format:
# Must include BEGIN/END markers
# No extra spaces or characters

# Check Oracle Cloud firewall:
# Ports 22, 3000, 3001 must be open
```

### Local Git Issues

```bash
# Accidentally committed .env:
git rm --cached .env
git commit -m "Remove .env from tracking"
git push origin main

# Reset to previous commit:
git reset --hard HEAD~1  # CAUTION: Loses changes!
```

### Merge Conflicts

```bash
# Pull latest first:
git pull origin main

# If conflicts:
# 1. Open conflicted files
# 2. Resolve conflicts manually
# 3. Mark as resolved:
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

---

## 📚 Quick Reference

### Development Cycle
```bash
1. git pull origin main
2. # Make changes
3. npm run build
4. pm2 start ecosystem.config.cjs  # Test locally
5. git add .
6. git commit -m "Description"
7. git push origin main  # Auto-deploys to cloud!
```

### Deployment URLs

**Development (Local):**
- Dashboard: http://localhost:3001/approval
- MCP Server: http://localhost:3000

**Production (Oracle Cloud):**
- Dashboard: http://YOUR_ORACLE_IP:3001/approval
- MCP Server: http://YOUR_ORACLE_IP:3000

---

## 🎯 Next Steps

1. ✅ Copy `.env.example` to `.env` and fill in values
2. ✅ Test locally with PM2 or Docker
3. ✅ Commit and push to GitHub
4. ✅ Set up GitHub Secrets
5. ✅ Deploy to Oracle Cloud
6. ✅ Watch GitHub Actions deploy automatically!

---

**Questions?** Check the main `README.md` or other documentation files.
