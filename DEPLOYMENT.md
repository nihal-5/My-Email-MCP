# 🚀 Deployment Guide - WhatsApp Resume Automation

This guide will help you deploy the WhatsApp Resume Automation bot to run 24/7 using Docker.

## 📋 Prerequisites

1. **Docker Desktop** installed
   - Mac: https://docs.docker.com/desktop/install/mac-install/
   - Windows: https://docs.docker.com/desktop/install/windows-install/
   - Linux: https://docs.docker.com/desktop/install/linux-install/

2. **API Keys** (all FREE options available!)
   - Hugging Face: https://huggingface.co/settings/tokens
   - Groq (optional): https://console.groq.com/keys

3. **Gmail App Password** for sending emails
   - Enable 2FA: https://myaccount.google.com/security
   - Create App Password: https://myaccount.google.com/apppasswords

## 🏠 Local Deployment (Docker Desktop)

### Step 1: Clone and Setup

```bash
# Clone the repository (if from GitHub)
git clone https://github.com/yourusername/agentkit.git
cd agentkit

# Create .env file from example
cp .env.example .env
```

### Step 2: Configure Environment

Edit `.env` file with your credentials:

```bash
# Required
MY_WHATSAPP_NUMBER=15715026464
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxx
GROQ_API_KEY=gsk_xxxxxxxxxxxxx (optional)
```

### Step 3: Build and Run

```bash
# Build the Docker image
docker-compose build

# Start the service in detached mode (runs in background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the service
docker-compose down
```

### Step 4: First-Time WhatsApp QR Scan

**Important:** On first run, you need to scan the WhatsApp QR code:

```bash
# View logs to see the QR code
docker-compose logs -f whatsapp-resume-bot

# You'll see output like:
# [INFO] Scan this QR code with WhatsApp:
# [QR CODE will be displayed]
```

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices** → **Link a Device**
3. Scan the QR code from the terminal logs
4. Once connected, the session is saved in `./data` folder
5. You won't need to scan again unless you delete the `./data` folder

### Step 5: Access the Dashboard

Once running, open your browser:

- **Approval Dashboard**: http://localhost:3001/approval
- **Health Check**: http://localhost:3000/health

## ☁️ Cloud Deployment (24/7 Operation)

### Option 1: AWS EC2

#### Launch an EC2 Instance

```bash
# 1. Create t2.medium instance (Ubuntu 22.04 LTS)
# 2. Configure Security Group:
#    - Port 22 (SSH) from your IP
#    - Port 3000 (API) from anywhere (optional)
#    - Port 3001 (Dashboard) from your IP only

# 3. SSH into instance
ssh -i your-key.pem ubuntu@your-instance-ip

# 4. Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
newgrp docker

# 5. Clone repository
git clone https://github.com/yourusername/agentkit.git
cd agentkit

# 6. Create .env file
nano .env
# Paste your configuration

# 7. Start service
docker-compose up -d

# 8. Enable auto-restart on reboot
sudo systemctl enable docker
```

#### First-Time QR Scan on Cloud

**Method 1: SSH with QR Display**
```bash
# View logs to see QR
docker-compose logs -f

# Scan the QR code with WhatsApp
```

**Method 2: Port Forwarding (if QR doesn't display properly)**
```bash
# On your LOCAL machine, create SSH tunnel
ssh -L 3001:localhost:3001 -i your-key.pem ubuntu@your-instance-ip

# Open http://localhost:3001/approval in your browser
# The dashboard will show the QR code
```

### Option 2: DigitalOcean Droplet

```bash
# 1. Create Droplet (Ubuntu 22.04, $12/month)
# 2. Same Docker installation as AWS
# 3. Same deployment steps
```

### Option 3: Azure Container Instances

```bash
# Build and push to Azure Container Registry
az acr build --registry yourregistry --image whatsapp-bot:latest .

# Deploy
az container create \
  --resource-group your-rg \
  --name whatsapp-resume-bot \
  --image yourregistry.azurecr.io/whatsapp-bot:latest \
  --dns-name-label whatsapp-bot \
  --ports 3000 3001 \
  --environment-variables \
    MCP_PORT=3000 \
    APPROVAL_PORT=3001
```

## 🔧 Maintenance

### View Logs
```bash
# Real-time logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service logs
docker-compose logs whatsapp-resume-bot
```

### Restart Service
```bash
# Restart without rebuilding
docker-compose restart

# Rebuild and restart (after code changes)
docker-compose up -d --build
```

### Update Code
```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

### Backup WhatsApp Session
```bash
# Create backup of session data
tar -czf whatsapp-session-backup.tar.gz data/

# Restore from backup
tar -xzf whatsapp-session-backup.tar.gz
```

### Monitor Resource Usage
```bash
# Check container stats
docker stats

# Check disk usage
docker system df
```

## 🛡️ Security Best Practices

1. **Never commit .env file**
   ```bash
   # Verify .env is in .gitignore
   git status
   ```

2. **Restrict Dashboard Access**
   - Use firewall rules to allow port 3001 only from your IP
   - Consider adding basic auth or VPN

3. **Regular Updates**
   ```bash
   # Update base images
   docker-compose pull
   docker-compose up -d
   ```

4. **Rotate API Keys**
   - Update .env file
   - Restart: `docker-compose restart`

## 📊 Monitoring

### Health Check
```bash
# Check if service is healthy
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2025-11-06T..."}
```

### WhatsApp Connection Status
```bash
# View logs for connection status
docker-compose logs | grep "WhatsApp client is ready"
```

## 🐛 Troubleshooting

### QR Code Not Displaying
```bash
# Check logs
docker-compose logs -f

# Restart service
docker-compose restart
```

### PDF Generation Fails
```bash
# Verify tectonic is installed in container
docker-compose exec whatsapp-resume-bot which tectonic

# Check permissions
docker-compose exec whatsapp-resume-bot ls -la /app/outbox
```

### High Memory Usage
```bash
# Check container stats
docker stats

# Restart to clear memory
docker-compose restart
```

### Container Keeps Restarting
```bash
# Check error logs
docker-compose logs --tail=50

# Common issues:
# - Missing .env file
# - Invalid API keys
# - Port conflicts (3000/3001 already in use)
```

## 🔄 Backup Strategy

### Automatic Daily Backup Script

Create `backup.sh`:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup WhatsApp session
tar -czf $BACKUP_DIR/whatsapp-session-$DATE.tar.gz data/

# Backup generated resumes
tar -czf $BACKUP_DIR/outbox-$DATE.tar.gz outbox/

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Schedule with cron:
```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

## 📈 Scaling (Future)

### Multiple Instances
```yaml
# docker-compose.yml
services:
  whatsapp-resume-bot:
    deploy:
      replicas: 3  # Run 3 instances
      restart_policy:
        condition: any
```

### Load Balancer
```bash
# Use nginx or traefik for load balancing
# Separate dashboard from API instances
```

## 📞 Support

- **Issues**: Check logs first: `docker-compose logs -f`
- **Updates**: Pull latest code: `git pull && docker-compose up -d --build`
- **Docs**: See README.md and other documentation files

## ✅ Success Checklist

- [ ] Docker Desktop installed
- [ ] .env file created with all keys
- [ ] `docker-compose up -d` successful
- [ ] WhatsApp QR code scanned
- [ ] Dashboard accessible at http://localhost:3001/approval
- [ ] Test JD submission works
- [ ] Received WhatsApp notification on your phone
- [ ] Email sending works
- [ ] PDF generation works

**You're all set for 24/7 operation!** 🎉
