#!/bin/bash

# WhatsApp Resume Automation - Quick Start Script
# This script helps you deploy the bot easily

set -e  # Exit on any error

echo "🚀 WhatsApp Resume Automation - Deployment Script"
echo "=================================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed!"
    echo "Please install Docker Desktop:"
    echo "  Mac: https://docs.docker.com/desktop/install/mac-install/"
    echo "  Windows: https://docs.docker.com/desktop/install/windows-install/"
    echo "  Linux: https://docs.docker.com/desktop/install/linux-install/"
    exit 1
fi

echo "✅ Docker found: $(docker --version)"

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed!"
    exit 1
fi

echo "✅ docker-compose found: $(docker-compose --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found!"
    echo ""
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo ""
    echo "📝 Please edit .env file with your credentials:"
    echo "  - MY_WHATSAPP_NUMBER"
    echo "  - SMTP_USER and SMTP_PASS"
    echo "  - HUGGINGFACE_API_KEY"
    echo ""
    echo "After editing .env, run this script again."
    exit 1
fi

echo "✅ .env file found"
echo ""

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p data/session
mkdir -p outbox
mkdir -p data/drafts
echo "✅ Directories created"
echo ""

# Parse command line arguments
ACTION=${1:-start}

case $ACTION in
    start)
        echo "🏗️  Building Docker image..."
        docker-compose build
        echo ""
        
        echo "🚀 Starting services..."
        docker-compose up -d
        echo ""
        
        echo "⏳ Waiting for services to start..."
        sleep 10
        echo ""
        
        echo "📱 Checking WhatsApp connection status..."
        echo "View logs with: docker-compose logs -f"
        echo ""
        
        echo "✅ Services started successfully!"
        echo ""
        echo "📋 Next steps:"
        echo "  1. View logs: docker-compose logs -f"
        echo "  2. Scan WhatsApp QR code (shown in logs)"
        echo "  3. Open dashboard: http://localhost:3001/approval"
        echo "  4. Test with a job description"
        echo ""
        echo "🔍 Quick commands:"
        echo "  - View logs: docker-compose logs -f"
        echo "  - Stop: docker-compose down"
        echo "  - Restart: docker-compose restart"
        echo "  - Rebuild: docker-compose up -d --build"
        ;;
    
    stop)
        echo "🛑 Stopping services..."
        docker-compose down
        echo "✅ Services stopped"
        ;;
    
    restart)
        echo "🔄 Restarting services..."
        docker-compose restart
        echo "✅ Services restarted"
        ;;
    
    logs)
        echo "📜 Showing logs (Ctrl+C to exit)..."
        docker-compose logs -f
        ;;
    
    rebuild)
        echo "🏗️  Rebuilding and restarting..."
        docker-compose down
        docker-compose build --no-cache
        docker-compose up -d
        echo "✅ Rebuild complete"
        ;;
    
    status)
        echo "📊 Service Status:"
        docker-compose ps
        echo ""
        echo "💾 Resource Usage:"
        docker stats --no-stream
        ;;
    
    backup)
        BACKUP_DIR="backups"
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        
        echo "💾 Creating backup..."
        mkdir -p $BACKUP_DIR
        
        echo "  - Backing up WhatsApp session..."
        tar -czf $BACKUP_DIR/whatsapp-session-$TIMESTAMP.tar.gz data/
        
        echo "  - Backing up generated resumes..."
        tar -czf $BACKUP_DIR/outbox-$TIMESTAMP.tar.gz outbox/
        
        echo "✅ Backup created:"
        echo "  - $BACKUP_DIR/whatsapp-session-$TIMESTAMP.tar.gz"
        echo "  - $BACKUP_DIR/outbox-$TIMESTAMP.tar.gz"
        ;;
    
    clean)
        echo "🧹 Cleaning up..."
        echo "⚠️  This will:"
        echo "  - Stop all containers"
        echo "  - Remove Docker images"
        echo "  - Keep data/ and outbox/ folders"
        echo ""
        read -p "Continue? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker-compose down
            docker system prune -f
            echo "✅ Cleanup complete"
        else
            echo "❌ Cleanup cancelled"
        fi
        ;;
    
    help|*)
        echo "Usage: ./deploy.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start      - Build and start services (default)"
        echo "  stop       - Stop all services"
        echo "  restart    - Restart services"
        echo "  logs       - View real-time logs"
        echo "  rebuild    - Clean rebuild and restart"
        echo "  status     - Show service and resource status"
        echo "  backup     - Create backup of session and resumes"
        echo "  clean      - Clean up Docker resources"
        echo "  help       - Show this help message"
        echo ""
        echo "Examples:"
        echo "  ./deploy.sh          # Start services"
        echo "  ./deploy.sh logs     # View logs"
        echo "  ./deploy.sh backup   # Create backup"
        ;;
esac
