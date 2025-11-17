#!/bin/bash

# Next Steps Helper - Shows you exactly what to do

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BOLD}========================================="
echo "🚀 Resume Automation - Next Steps"
echo -e "=========================================\n${NC}"

# Check if email is configured
if grep -q "YOUR_GMAIL_APP_PASSWORD_HERE" .env 2>/dev/null; then
    EMAIL_CONFIGURED=false
else
    EMAIL_CONFIGURED=true
fi

# Check if build exists
if [ -d "dist" ]; then
    BUILD_EXISTS=true
else
    BUILD_EXISTS=false
fi

# Check if server is running
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    SERVER_RUNNING=true
else
    SERVER_RUNNING=false
fi

# Status Summary
echo -e "${BOLD}📊 System Status:${NC}\n"

if [ "$EMAIL_CONFIGURED" = true ]; then
    echo -e "  ${GREEN}✅ Email configured${NC}"
else
    echo -e "  ${RED}❌ Email not configured${NC}"
fi

if [ "$BUILD_EXISTS" = true ]; then
    echo -e "  ${GREEN}✅ Project built${NC}"
else
    echo -e "  ${YELLOW}⚠️  Project not built${NC}"
fi

if [ "$SERVER_RUNNING" = true ]; then
    echo -e "  ${GREEN}✅ Server is running${NC}"
else
    echo -e "  ${YELLOW}⚠️  Server not running${NC}"
fi

echo ""

# What to do next
echo -e "${BOLD}📋 What To Do Next:${NC}\n"

if [ "$EMAIL_CONFIGURED" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  ⭐ STEP 1: Configure Email${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    echo -e "  Run this command:"
    echo -e "  ${GREEN}./setup-email.sh${NC}\n"

    echo -e "  What happens:"
    echo -e "    1. Opens Gmail App Password page"
    echo -e "    2. You generate a 16-char password"
    echo -e "    3. Paste it when asked"
    echo -e "    4. Script configures everything"
    echo -e "    5. Tests that it works"
    echo -e "    6. Done! ✅\n"

    echo -e "  ${BLUE}This takes 2 minutes total.${NC}\n"

elif [ "$BUILD_EXISTS" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  ⭐ STEP 2: Build Project${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    echo -e "  Run this command:"
    echo -e "  ${GREEN}npm run build${NC}\n"

elif [ "$SERVER_RUNNING" = false ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  ⭐ STEP 3: Start Server${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    echo -e "  Run this command:"
    echo -e "  ${GREEN}npm start${NC}\n"

    echo -e "  What happens:"
    echo -e "    1. WhatsApp connects (QR code first time)"
    echo -e "    2. Srinu monitor starts"
    echo -e "    3. System ready for JDs!"
    echo -e "    4. Leave it running in background\n"

else
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  🎉 SYSTEM IS RUNNING!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"

    echo -e "  Your resume automation is ${GREEN}LIVE${NC}! 🚀\n"

    echo -e "  ${BOLD}How to test:${NC}"
    echo -e "    1. Have Srinu send a JD via WhatsApp"
    echo -e "    2. Wait up to 30 seconds (polling interval)"
    echo -e "    3. Watch the console logs"
    echo -e "    4. Get WhatsApp confirmation"
    echo -e "    5. Check ./outbox/ for PDF\n"

    echo -e "  ${BOLD}Manual test commands:${NC}"
    echo -e "    ${GREEN}curl http://localhost:3000/health${NC}"
    echo -e "    ${GREEN}curl http://localhost:3000/tools${NC}"
    echo -e "    ${GREEN}node test-email.js${NC}"
    echo -e "    ${GREEN}./test-system.sh${NC}\n"
fi

echo -e "${BOLD}📚 Documentation:${NC}\n"
echo -e "  ${BLUE}START_HERE.md${NC}      - Begin here!"
echo -e "  ${BLUE}EMAIL_SETUP.md${NC}     - Email configuration guide"
echo -e "  ${BLUE}QUICK_START.md${NC}     - Quick start guide"
echo -e "  ${BLUE}SYSTEM_COMPLETE.md${NC} - Complete documentation\n"

echo -e "${BOLD}🛠  Useful Commands:${NC}\n"
echo -e "  ${GREEN}./setup-email.sh${NC}   - Configure email"
echo -e "  ${GREEN}npm start${NC}           - Start the server"
echo -e "  ${GREEN}npm run dev${NC}         - Development mode"
echo -e "  ${GREEN}node test-email.js${NC}  - Test email"
echo -e "  ${GREEN}./test-system.sh${NC}    - Test full system"
echo -e "  ${GREEN}./next-steps.sh${NC}     - Show this help\n"

if [ "$EMAIL_CONFIGURED" = false ]; then
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  👉 Run this now: ${GREEN}./setup-email.sh${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}\n"
fi
