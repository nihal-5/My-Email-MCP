# ✅ Deployment Checklist

Use this checklist to track your deployment progress.

---

## 📋 Phase 1: Oracle Cloud Setup

- [ ] Created Oracle Cloud account (https://www.oracle.com/cloud/free/)
- [ ] Verified email
- [ ] Added payment method (for verification)
- [ ] Created VM instance (VM.Standard.E2.1.Micro - Always Free)
- [ ] Selected Ubuntu 22.04 image
- [ ] Downloaded SSH keys (both public and private)
- [ ] Saved public IP address: `________________`
- [ ] Configured Oracle Cloud security list (ports 22, 3000, 3001)
- [ ] Successfully SSH'd into server
- [ ] Ran `oracle-setup.sh` script
- [ ] Configured Ubuntu firewall (ufw)
- [ ] Docker installed and working
- [ ] Docker Compose installed and working

---

## 📋 Phase 2: GitHub Setup

- [ ] Created GitHub account (or using existing)
- [ ] Created new repository (private recommended)
  - Repository name: `________________`
  - Repository URL: `________________`
- [ ] Verified `.env` is in `.gitignore`
- [ ] Initialized git in local project
- [ ] Committed code to git
- [ ] Pushed to GitHub main branch
- [ ] Verified `.env` NOT in GitHub (security check!)
- [ ] Repository accessible online

---

## 📋 Phase 3: Oracle Cloud Initial Deployment

- [ ] SSH'd into Oracle Cloud server
- [ ] Cloned GitHub repository to server
- [ ] Created `.env` file on server with all credentials
- [ ] Environment variables set:
  - [ ] `MY_WHATSAPP_NUMBER`
  - [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
  - [ ] `HUGGINGFACE_API_KEY`
  - [ ] `GROQ_API_KEY`
  - [ ] `RECRUITER_WHATSAPP`
- [ ] Ran `./deploy.sh start`
- [ ] Docker containers started successfully
- [ ] Scanned WhatsApp QR code (one-time)
- [ ] WhatsApp connected and authenticated
- [ ] Dashboard accessible: `http://YOUR_IP:3001/approval`
- [ ] Tested dashboard on laptop browser
- [ ] Tested dashboard on phone browser

---

## 📋 Phase 4: GitHub Actions Setup

- [ ] Went to GitHub repo → Settings → Secrets and variables → Actions
- [ ] Added secret: `ORACLE_HOST` = Oracle Cloud public IP
- [ ] Added secret: `ORACLE_USERNAME` = `ubuntu`
- [ ] Added secret: `ORACLE_SSH_KEY` = Private SSH key content
- [ ] Verified all 3 secrets are set correctly
- [ ] `.github/workflows/deploy.yml` file exists in repo
- [ ] Pushed workflow file to GitHub

---

## 📋 Phase 5: Testing

### Automatic Deployment Test
- [ ] Made small code change (e.g., added comment to README)
- [ ] Committed change: `git commit -m "Test deployment"`
- [ ] Pushed to GitHub: `git push`
- [ ] Went to GitHub Actions tab
- [ ] Saw "Deploy to Oracle Cloud" workflow running
- [ ] Workflow completed successfully (green checkmark)
- [ ] SSH'd to server and verified code updated
- [ ] Containers restarted automatically
- [ ] Dashboard still accessible after deployment

### Application Test
- [ ] Submitted manual JD via dashboard
- [ ] Bot processed job description
- [ ] AI customized resume
- [ ] Email generated
- [ ] Received WhatsApp notification on phone
- [ ] Opened dashboard on phone
- [ ] Approved resume
- [ ] Email sent successfully
- [ ] Checked recruiter email received (if test email)

### WhatsApp Monitoring Test
- [ ] Recruiter sent test JD via WhatsApp (or simulated)
- [ ] Bot detected message
- [ ] Resume generated and queued for approval
- [ ] Notification received
- [ ] Able to approve from phone

---

## 📋 Phase 6: Final Verification

### System Health
- [ ] Oracle Cloud VM running: `docker ps` shows containers
- [ ] WhatsApp client connected (check logs)
- [ ] Dashboard loads without errors
- [ ] No errors in logs: `docker-compose logs --tail=50`
- [ ] Health check passing: `curl http://localhost:3000/health`

### Security
- [ ] `.env` file NOT in GitHub repository (CRITICAL!)
- [ ] SSH key secure (chmod 400)
- [ ] GitHub repository is private (recommended)
- [ ] Firewall rules correct (Oracle + Ubuntu)
- [ ] No API keys hardcoded in source code

### Access
- [ ] Can access dashboard from laptop
- [ ] Can access dashboard from phone
- [ ] Can approve/reject from phone
- [ ] Can approve/reject from laptop
- [ ] Works on different WiFi networks
- [ ] Works on mobile data (phone)

### Automation
- [ ] Code push triggers deployment automatically
- [ ] Deployment completes in 2-3 minutes
- [ ] Containers restart after deployment
- [ ] WhatsApp stays connected after deployment
- [ ] No manual intervention needed

---

## 📋 Phase 7: Documentation

- [ ] Saved Oracle Cloud IP in password manager
- [ ] Saved SSH key in secure location
- [ ] Saved GitHub repo URL
- [ ] Documented SMTP credentials
- [ ] Documented API keys
- [ ] Know how to SSH to server
- [ ] Know how to view logs
- [ ] Know how to restart system
- [ ] Bookmarked dashboard URL
- [ ] Shared dashboard URL with family (if needed)

---

## 🎯 Success Criteria

You're done when ALL of these are true:

✅ **Oracle Cloud**: VM running, accessible via SSH, $0 cost
✅ **GitHub**: Code pushed, secrets configured, private repo
✅ **Docker**: Containers running, auto-restart enabled
✅ **WhatsApp**: Connected, monitoring messages, notifications working
✅ **Dashboard**: Accessible from phone & laptop, approve/reject working
✅ **Email**: Sending successfully with customized resumes
✅ **Automation**: Git push → Auto-deploy → Live in 2-3 minutes
✅ **Security**: No secrets in GitHub, firewall configured
✅ **Cost**: $0/month verified
✅ **Uptime**: 24/7, works when laptop closed

---

## 📊 Quick Status Check

Run these commands to verify everything:

```bash
# 1. Check if you can SSH
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_IP

# 2. Check containers running
docker ps

# 3. Check logs for errors
docker-compose logs --tail=50

# 4. Check if dashboard accessible
curl http://localhost:3001/approval

# 5. Check WhatsApp connection
docker-compose logs | grep "WhatsApp client is ready"

# 6. Check GitHub Actions
# Open: https://github.com/YOUR_USERNAME/agentkit/actions
```

---

## 🆘 If Something Fails

### Oracle Cloud VM not accessible
- [ ] Check Oracle Cloud Console - instance running?
- [ ] Check security list rules (ports 22, 3000, 3001)
- [ ] Verify IP address is correct
- [ ] Check SSH key permissions: `chmod 400 ~/.ssh/oracle-cloud-key.pem`

### GitHub Actions failing
- [ ] Check Actions tab for error message
- [ ] Verify all 3 secrets are set correctly
- [ ] SSH manually and test git pull
- [ ] Check server has enough disk space: `df -h`

### WhatsApp disconnected
- [ ] Restart containers: `./deploy.sh restart`
- [ ] Check logs: `docker-compose logs -f`
- [ ] Re-scan QR code if needed
- [ ] Verify `data/` folder exists

### Dashboard not loading
- [ ] Check firewall: `sudo ufw status`
- [ ] Check containers: `docker ps`
- [ ] Check logs: `docker-compose logs`
- [ ] Try: `./deploy.sh restart`

---

## 📝 Post-Deployment Notes

**Dashboard URL**: `http://________________:3001/approval`

**SSH Command**: 
```bash
ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@________________
```

**GitHub Repo**: `https://github.com/________________/________________`

**Deployment Date**: `________________`

**WhatsApp Connected**: ✅ / ❌

**Cost per Month**: $0 💰

**Estimated Setup Time**: ________ hours

**Issues Encountered**: 
```
_____________________________________________
_____________________________________________
_____________________________________________
```

**Notes**:
```
_____________________________________________
_____________________________________________
_____________________________________________
```

---

## 🎉 Congratulations!

Once all checkboxes are ✅, you have:

- 🚀 24/7 automated job application system
- 📱 Mobile-accessible approval dashboard
- 🤖 AI-powered resume customization
- 💰 $0/month operating cost
- 🔄 Auto-deployment from GitHub
- 🌍 Accessible from anywhere in the world

**Time to start applying to jobs!** 🎊

---

**Last Updated**: `________________`
**System Status**: 🟢 Operational / 🟡 Issues / 🔴 Down
