#!/bin/bash

# Oracle Cloud Quick Setup Script
# Run this on your Oracle Cloud VM after SSH login

echo "🚀 WhatsApp Resume Bot - Oracle Cloud Setup"
echo "============================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "❌ Please don't run as root. Run as: ubuntu user"
   exit 1
fi

echo "📦 Step 1: Updating system..."
sudo apt-get update -qq

echo "🐳 Step 2: Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

echo "🔧 Step 3: Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo apt-get install -y docker-compose
    echo "✅ Docker Compose installed"
else
    echo "✅ Docker Compose already installed"
fi

echo "📦 Step 4: Installing Git..."
if ! command -v git &> /dev/null; then
    sudo apt-get install -y git
    echo "✅ Git installed"
else
    echo "✅ Git already installed"
fi

echo "🔥 Step 5: Configuring firewall..."
sudo ufw --force enable
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 3000/tcp comment 'MCP API'
sudo ufw allow 3001/tcp comment 'Dashboard'
echo "✅ Firewall configured"

echo ""
echo "============================================"
echo "✅ Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Exit and reconnect: exit"
echo "2. SSH back in: ssh -i ~/.ssh/oracle-cloud-key.pem ubuntu@YOUR_IP"
echo "3. Upload your code or clone from git"
echo "4. Create .env file with your API keys"
echo "5. Run: ./deploy.sh start"
echo ""
echo "📖 Full guide: ORACLE_CLOUD_DEPLOYMENT.md"
echo ""
