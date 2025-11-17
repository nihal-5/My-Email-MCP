# 🚀 GitHub Actions Auto-Deployment Setup

Complete guide for automatic deployment to Oracle Cloud via GitHub Actions.

---

## 🎯 How It Works

1. **You make changes** to code on your Mac
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Updated resume template"
   git push
   ```
3. **GitHub Actions triggers** automatically
4. **Connects to Oracle Cloud** via SSH
5. **Pulls latest code**
6. **Rebuilds Docker containers**
7. **Restarts services**
8. **Done!** Your changes are LIVE! ✅

**Total time**: ~2-3 minutes per deployment

---

## 📋 Prerequisites

Before setting up GitHub Actions, you need:

✅ Oracle Cloud VM running (follow `ORACLE_CLOUD_DEPLOYMENT.md`)
✅ GitHub repository created
✅ Code pushed to GitHub
✅ SSH key for Oracle Cloud VM

---

## 🔐 Part 1: Set Up GitHub Secrets (5 minutes)

GitHub Actions needs 3 secrets to connect to your Oracle Cloud VM.

### Step 1: Go to GitHub Repository Settings

1. Open your GitHub repo: `https://github.com/YOUR_USERNAME/agentkit`
2. Click **Settings** tab
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add ORACLE_HOST Secret

- **Name**: `ORACLE_HOST`
- **Value**: Your Oracle Cloud VM public IP
  - Example: `158.101.123.45`
  - Get from Oracle Cloud Console → Compute → Instances
- Click **Add secret**

### Step 3: Add ORACLE_USERNAME Secret

- **Name**: `ORACLE_USERNAME`
- **Value**: `ubuntu`
  - This is the default username for Ubuntu instances
- Click **Add secret**

### Step 4: Add ORACLE_SSH_KEY Secret

- **Name**: `ORACLE_SSH_KEY`
- **Value**: Your private SSH key content

**To get your SSH key content:**

```bash
# On your Mac, display the private key
cat ~/.ssh/oracle-cloud-key.pem
```

Copy **EVERYTHING**, including:
```
-----BEGIN RSA PRIVATE KEY-----
...entire key content...
-----END RSA PRIVATE KEY-----
```

Paste into GitHub secret value, then click **Add secret**.

### ✅ Verify Secrets

You should now have 3 secrets:
- ✅ `ORACLE_HOST`
- ✅ `ORACLE_USERNAME`
- ✅ `ORACLE_SSH_KEY`

---

## 🐙 Part 2: Set Up Git Repository (10 minutes)

### If you haven't created a GitHub repo yet:

1. **Create new repo** on GitHub:
   - Go to: https://github.com/new
   - Name: `agentkit` (or `whatsapp-resume-bot`)
   - Private: ✅ Recommended (keep your code private)
   - Don't initialize with README (we have code already)
   - Click **Create repository**

2. **Push your code** from your Mac:

```bash
cd /Users/nihalveeramalla/projects/agentkit

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - WhatsApp Resume Automation"

# Add GitHub as remote
git remote add origin https://github.com/YOUR_USERNAME/agentkit.git

# Push to GitHub
git branch -M main
git push -u origin main
```

**IMPORTANT**: Before pushing, make sure `.env` is in `.gitignore`!

```bash
# Check .gitignore contains .env
cat .gitignore | grep ".env"

# If not, add it
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Add .env to gitignore"
```

---

## 🔧 Part 3: Prepare Oracle Cloud VM (5 minutes)

Your Oracle Cloud VM needs to have the code and be set up for automatic pulls.

### SSH into your Oracle Cloud VM:

```bash
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_ORACLE_IP
```

### Clone your GitHub repo (first time only):

```bash
# If you haven't already cloned your repo
cd ~
git clone https://github.com/YOUR_USERNAME/agentkit.git
cd agentkit
```

### Create .env file on server:

```bash
nano .env
```

Paste your environment variables:
```env
MY_WHATSAPP_NUMBER=15715026464
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
HUGGINGFACE_API_KEY=your_huggingface_key_here
GROQ_API_KEY=your_groq_api_key_here
RECRUITER_WHATSAPP=your_whatsapp_number
```

Save: `Ctrl+X`, `Y`, `Enter`

### Configure git for pulls:

```bash
# Set git to use main or master branch
git config pull.rebase false

# Test that git pull works
git pull origin main
# or
git pull origin master
```

### Initial deployment:

```bash
chmod +x deploy.sh
./deploy.sh start
```

Wait for WhatsApp to connect (scan QR code if needed).

---

## 🎬 Part 4: Test GitHub Actions (2 minutes)

### Make a test change:

On your Mac:
```bash
cd /Users/nihalveeramalla/projects/agentkit

# Make a small change (e.g., add a comment)
echo "# Test deployment" >> README.md

# Commit and push
git add README.md
git commit -m "Test GitHub Actions deployment"
git push
```

### Watch the deployment:

1. Go to your GitHub repo
2. Click **Actions** tab
3. You should see "Deploy to Oracle Cloud" running
4. Click on it to see live logs
5. Wait ~2-3 minutes
6. Should show ✅ Success!

### Verify on Oracle Cloud:

```bash
# SSH to your server
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_ORACLE_IP

# Check if code updated
cd ~/agentkit
git log -1

# Check if containers restarted
docker ps

# Check logs
docker-compose logs --tail=20
```

---

## 📖 Part 5: Daily Workflow

### Normal development:

```bash
# 1. Make changes to your code on Mac
vim src/some-file.ts

# 2. Test locally (optional)
npm run build
pm2 restart whatsapp-resume-bot

# 3. Commit changes
git add .
git commit -m "Fixed email template"

# 4. Push to GitHub
git push

# 5. GitHub Actions automatically deploys to Oracle Cloud!
# ✅ Done! Changes are live in 2-3 minutes
```

### View deployment status:

- GitHub repo → **Actions** tab
- See all deployments, status, logs

### Manual deployment (if needed):

1. Go to GitHub repo → **Actions** tab
2. Click "Deploy to Oracle Cloud" workflow
3. Click **Run workflow** button
4. Select branch (usually `main`)
5. Click **Run workflow**

---

## 🛠️ Troubleshooting

### Deployment fails with "Permission denied":

**Fix SSH key permissions:**
- Make sure you copied the ENTIRE private key
- Include `-----BEGIN RSA PRIVATE KEY-----` and `-----END RSA PRIVATE KEY-----`
- No extra spaces or newlines

### Deployment fails with "Could not resolve host":

**Check ORACLE_HOST secret:**
- Go to GitHub repo → Settings → Secrets
- Verify `ORACLE_HOST` is correct IP address
- No `http://` or trailing slashes

### Git pull fails on Oracle Cloud:

**Fix on server:**
```bash
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_ORACLE_IP
cd ~/agentkit

# Reset any local changes
git stash

# Pull again
git pull origin main
```

### Docker build fails:

**Check logs:**
- GitHub Actions → Click on failed deployment
- Expand "Deploy to Oracle Cloud" step
- Look for error message

**Common fixes:**
```bash
# SSH to server
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_ORACLE_IP
cd ~/agentkit

# Clean Docker
docker-compose down
docker system prune -f

# Rebuild manually
docker-compose build --no-cache
docker-compose up -d
```

---

## 🔒 Security Best Practices

### ✅ DO:
- ✅ Keep `.env` in `.gitignore` (NEVER commit secrets!)
- ✅ Use GitHub Secrets for sensitive data
- ✅ Use private GitHub repository
- ✅ Rotate SSH keys periodically
- ✅ Review deployment logs

### ❌ DON'T:
- ❌ Commit `.env` file to GitHub
- ❌ Share SSH private keys
- ❌ Use public repo for production code
- ❌ Hardcode API keys in code

---

## 📊 Monitoring Deployments

### View all deployments:
```
https://github.com/YOUR_USERNAME/agentkit/actions
```

### Email notifications:
- GitHub → Settings → Notifications
- Enable "Actions" notifications
- Get email when deployments fail

### Slack notifications (optional):
Add to `.github/workflows/deploy.yml`:
```yaml
- name: Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

---

## 🎯 Advanced Features

### Deploy only on specific file changes:

Update `.github/workflows/deploy.yml`:
```yaml
on:
  push:
    branches: [ main ]
    paths:
      - 'src/**'
      - 'Dockerfile'
      - 'docker-compose.yml'
```

### Multi-environment deployment:

```yaml
on:
  push:
    branches:
      - main    # production
      - dev     # development
```

### Rollback to previous version:

```bash
# On Oracle Cloud server
cd ~/agentkit
git log --oneline  # Find previous commit
git reset --hard COMMIT_HASH
./deploy.sh restart
```

---

## ✅ Setup Checklist

After completing all steps:

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] `.env` in `.gitignore` (verified!)
- [ ] GitHub Secrets added (3 secrets)
- [ ] Oracle Cloud VM has code cloned
- [ ] `.env` file created on Oracle Cloud
- [ ] Initial deployment successful
- [ ] Test push triggers deployment
- [ ] Containers restart automatically
- [ ] Dashboard accessible after deployment

---

## 🎉 You're All Set!

Your workflow is now:

1. **Code on Mac** → 2. **Push to GitHub** → 3. **Auto-deploy to Oracle Cloud** → 4. **Live in 2 minutes!**

**No more:**
- ❌ Manual SSH
- ❌ Manual git pulls
- ❌ Manual docker builds
- ❌ Forgetting to restart

**Everything automatic!** 🚀

---

## 📞 Quick Reference

### Make changes and deploy:
```bash
git add .
git commit -m "Your change description"
git push
```

### View deployment status:
```
https://github.com/YOUR_USERNAME/agentkit/actions
```

### SSH to server (if needed):
```bash
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_ORACLE_IP
```

### View live logs:
```bash
# On Oracle Cloud
cd ~/agentkit
docker-compose logs -f
```

---

**Happy deploying!** 🎊
