# 🆓 Oracle Cloud FREE Deployment Guide
## WhatsApp Resume Automation - 100% FREE Forever!

---

## 🎯 Why Oracle Cloud?

✅ **ALWAYS FREE** - No credit card needed (after trial)
✅ **Powerful** - 24GB RAM ARM instances available
✅ **Never expires** - Truly free forever
✅ **24/7 uptime** - Enterprise-grade infrastructure
✅ **Global** - Data centers worldwide

---

## 📝 Step-by-Step Deployment

### Part 1: Create Oracle Cloud Account (5 minutes)

1. **Go to**: https://www.oracle.com/cloud/free/
2. **Click**: "Start for free"
3. **Fill in details**:
   - Email address
   - Country
   - Cloud account name (e.g., `nihal-resume-bot`)
4. **Verify email**
5. **Add payment** (for verification - you won't be charged!)
   - Gets $300 free credit for 30 days
   - After that, Always Free tier continues forever

---

### Part 2: Create Free VM Instance (10 minutes)

1. **Login to Oracle Cloud Console**: https://cloud.oracle.com

2. **Navigate to Compute**:
   - Menu (☰) → Compute → Instances

3. **Click**: "Create Instance"

4. **Configure Instance**:

   **Name**: `whatsapp-resume-bot`
   
   **Image and Shape**:
   - Click "Change Image"
   - Select: **Ubuntu 22.04** (Minimal or standard)
   - Click "Change Shape"
   - Select: **VM.Standard.E2.1.Micro** (Always Free eligible)
     - 1 OCPU, 1GB RAM - Perfect for our bot!
   
   **Networking**:
   - Use default VCN (Virtual Cloud Network)
   - Assign public IP: ✅ YES (IMPORTANT!)
   
   **Add SSH Keys**:
   - Click "Generate a key pair for me"
   - Download BOTH keys (private and public)
   - Save to safe location (e.g., `~/Downloads/oracle-cloud-key.pem`)

5. **Click**: "Create"

6. **Wait 2-3 minutes** for instance to provision

7. **Copy Public IP**:
   - Instance details → Public IP address
   - Example: `158.101.123.45`
   - **Save this!** You'll need it

---

### Part 3: Configure Firewall (5 minutes)

Oracle Cloud has TWO firewalls - we need to open both!

#### A. Security List (Oracle Cloud Firewall)

1. **In Instance Details**, click your subnet name (under "Primary VNIC")

2. **Click**: Default Security List

3. **Add Ingress Rules** - Click "Add Ingress Rules" for EACH:

   **Rule 1 - SSH**:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `22`
   - Description: SSH access
   
   **Rule 2 - Dashboard**:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `3001`
   - Description: Approval Dashboard
   
   **Rule 3 - API**:
   - Source CIDR: `0.0.0.0/0`
   - Destination Port: `3000`
   - Description: MCP Server API

#### B. Ubuntu Firewall (Inside VM)

We'll do this after SSH login (Part 4).

---

### Part 4: Connect to Your Server (2 minutes)

1. **Open Terminal** on your Mac

2. **Set key permissions**:
   ```bash
   chmod 400 ~/Downloads/oracle-cloud-key.pem
   ```

3. **SSH into server**:
   ```bash
   ssh -i ~/Downloads/oracle-cloud-key.pem ubuntu@YOUR_PUBLIC_IP
   ```
   
   Replace `YOUR_PUBLIC_IP` with the IP you copied earlier
   
   Example:
   ```bash
   ssh -i ~/Downloads/oracle-cloud-key.pem ubuntu@158.101.123.45
   ```

4. **Type "yes"** when asked about fingerprint

5. **You're in!** You should see:
   ```
   ubuntu@whatsapp-resume-bot:~$
   ```

---

### Part 5: Install Docker on Server (5 minutes)

Run these commands one by one:

```bash
# Update system
sudo apt-get update

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (no need for sudo)
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo apt-get install -y docker-compose

# Exit and reconnect for group changes
exit
```

**Reconnect**:
```bash
ssh -i ~/Downloads/oracle-cloud-key.pem ubuntu@YOUR_PUBLIC_IP
```

**Verify Docker works**:
```bash
docker --version
docker-compose --version
```

---

### Part 6: Configure Ubuntu Firewall (2 minutes)

```bash
# Allow SSH (important - don't lock yourself out!)
sudo ufw allow 22/tcp

# Allow dashboard
sudo ufw allow 3001/tcp

# Allow MCP API
sudo ufw allow 3000/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

You should see:
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
3000/tcp                   ALLOW       Anywhere
3001/tcp                   ALLOW       Anywhere
```

---

### Part 7: Upload Your Code (5 minutes)

#### Option A: Using Git (Recommended)

On your Oracle Cloud server:
```bash
# Install git
sudo apt-get install -y git

# Clone your repo (if you pushed to GitHub)
git clone YOUR_GITHUB_REPO_URL
cd agentkit
```

#### Option B: Manual Upload

On your **Mac terminal** (different terminal, not the SSH one):

```bash
# Go to your project
cd /Users/nihalveeramalla/projects/agentkit

# Upload entire folder to server
scp -i ~/Downloads/oracle-cloud-key.pem -r ./* ubuntu@YOUR_PUBLIC_IP:~/agentkit/
```

This will take 2-3 minutes to upload everything.

---

### Part 8: Configure Environment Variables (3 minutes)

On your **Oracle Cloud server** (SSH terminal):

```bash
cd ~/agentkit

# Create .env file
nano .env
```

**Paste this** (update with your actual values):
```env
# WhatsApp Settings
MY_WHATSAPP_NUMBER=15715026464

# Email Settings (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com

# AI API Keys (FREE!)
HUGGINGFACE_API_KEY=your_huggingface_key_here
GROQ_API_KEY=your_groq_api_key_here

# Job Search Settings
RECRUITER_WHATSAPP=your_whatsapp_number
```

**Save**:
- Press `Ctrl + X`
- Press `Y`
- Press `Enter`

---

### Part 9: Deploy! (3 minutes)

```bash
# Make deploy script executable
chmod +x deploy.sh

# Start the application!
./deploy.sh start
```

You'll see:
```
🏗️  Building Docker image...
🚀 Starting services...
✅ Services started successfully!
```

**View logs**:
```bash
docker-compose logs -f
```

**Look for**:
```
[INFO] WhatsApp client is ready!
[INFO] MCP Server listening on port 3000
[INFO] Approval Dashboard: http://localhost:3001/approval
```

Press `Ctrl + C` to exit logs (app keeps running).

---

### Part 10: Scan WhatsApp QR Code (FIRST TIME ONLY)

#### If QR code is in logs:
```bash
docker-compose logs | grep -A 20 "QR Code"
```

#### If QR code NOT showing:

**On your Mac** (new terminal):
```bash
# Create SSH tunnel
ssh -i ~/Downloads/oracle-cloud-key.pem -L 3001:localhost:3001 ubuntu@YOUR_PUBLIC_IP
```

Keep this terminal open, then:
- Open browser: http://localhost:3001/approval
- Or check logs in terminal

**Once you see QR code**:
1. Open WhatsApp on your phone
2. Go to Settings → Linked Devices
3. Tap "Link a Device"
4. Scan the QR code
5. Done! WhatsApp is connected forever!

---

## 🎉 DEPLOYED! Access Your System

### From Your Phone:
```
http://YOUR_PUBLIC_IP:3001/approval
```
Example: `http://158.101.123.45:3001/approval`

- ✅ Approve/reject resumes
- ✅ Works from anywhere
- ✅ 24/7 monitoring
- ✅ Even when your Mac is off!

### From Your Laptop:
Same URL - works from any browser, anywhere in the world!

---

## 📱 Daily Usage

1. **Srinu sends job** → Bot processes automatically
2. **You get WhatsApp notification** on your phone
3. **Open**: `http://YOUR_PUBLIC_IP:3001/approval`
4. **Tap "Approve"** → Email sent instantly!
5. **Done!**

---

## 🛠️ Management Commands

**SSH into server**:
```bash
ssh -i ~/Downloads/oracle-cloud-key.pem ubuntu@YOUR_PUBLIC_IP
cd ~/agentkit
```

**View logs**:
```bash
docker-compose logs -f
```

**Stop system**:
```bash
./deploy.sh stop
```

**Start system**:
```bash
./deploy.sh start
```

**Restart system**:
```bash
./deploy.sh restart
```

**Check status**:
```bash
./deploy.sh status
```

**Backup data**:
```bash
./deploy.sh backup
```

---

## 🔒 Security Best Practices

1. **Change SSH key location**:
   ```bash
   mkdir -p ~/.ssh
   mv ~/Downloads/oracle-cloud-key.pem ~/.ssh/
   chmod 400 ~/.ssh/oracle-cloud-key.pem
   ```

2. **Update your SSH command**:
   ```bash
   ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_PUBLIC_IP
   ```

3. **Keep .env file secure** - Never commit to GitHub!

4. **Regular updates**:
   ```bash
   sudo apt-get update && sudo apt-get upgrade -y
   ```

---

## 🆘 Troubleshooting

### Can't connect via SSH:
```bash
# Check key permissions
chmod 400 ~/.ssh/oracle-cloud-key.pem

# Verify IP is correct
# Check Oracle Cloud Console → Instance Details
```

### Can't access dashboard:
```bash
# Check if ports are open
sudo ufw status

# Check if containers are running
docker ps

# Check logs
docker-compose logs
```

### WhatsApp disconnected:
```bash
# Restart containers
./deploy.sh restart

# Check logs
docker-compose logs -f

# Re-scan QR code if needed
```

### Out of memory:
```bash
# Check usage
docker stats

# Restart with cleanup
./deploy.sh rebuild
```

---

## 💰 Cost Breakdown

### Oracle Cloud Always Free:
- **VM Instance**: $0 (Always Free tier)
- **Network**: $0 (10TB/month free)
- **Storage**: $0 (200GB free)
- **Total**: **$0/month FOREVER!** 🎉

### Total System Cost:
- Oracle Cloud: $0
- Hugging Face AI: $0
- Groq AI: $0
- Gmail SMTP: $0
- **Grand Total**: **$0/month** 🚀

---

## ✅ Success Checklist

After deployment, verify:

- [ ] VM instance is running in Oracle Cloud
- [ ] Can SSH into server
- [ ] Docker and docker-compose installed
- [ ] Firewall rules configured (Oracle + Ubuntu)
- [ ] Code uploaded to server
- [ ] .env file configured with all keys
- [ ] Docker containers running (`docker ps`)
- [ ] WhatsApp connected (scanned QR code)
- [ ] Dashboard accessible from browser
- [ ] Dashboard accessible from phone
- [ ] Can approve/reject from dashboard
- [ ] WhatsApp notifications arriving on phone

---

## 🎯 Next Steps After Deployment

1. **Test the system**:
   - Submit a manual JD via dashboard
   - Verify you get WhatsApp notification
   - Approve it and check email sent

2. **Monitor for a day**:
   - Check logs: `docker-compose logs -f`
   - Verify no errors

3. **Set up monitoring** (optional):
   - Oracle Cloud Monitoring (built-in)
   - Set up email alerts for instance down

4. **Backup schedule** (optional):
   ```bash
   # Add to crontab
   crontab -e
   
   # Add this line (daily backup at 2 AM):
   0 2 * * * cd ~/agentkit && ./deploy.sh backup
   ```

---

## 🚀 You're LIVE!

Your WhatsApp Resume Automation is now:
✅ Running 24/7 on Oracle Cloud
✅ 100% FREE forever
✅ Accessible from phone & laptop
✅ Never missing a job posting
✅ Professional and reliable

**Total Cost**: $0/month
**Uptime**: 24/7/365
**Access**: From anywhere in the world

---

## 📞 Support

If you need help:
1. Check logs: `docker-compose logs -f`
2. Review troubleshooting section above
3. Check Oracle Cloud documentation
4. Verify all firewall rules are correct

---

**Ready to deploy?** Let's do this! 🚀
