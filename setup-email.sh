#!/bin/bash

# Email Configuration Helper Script
# This script makes it super easy to configure Gmail for resume automation

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

clear

echo -e "${BOLD}========================================="
echo "📧 Email Configuration Helper"
echo -e "=========================================\n${NC}"

echo -e "${BLUE}This script will help you configure Gmail for your resume automation system.${NC}\n"

# Step 1: Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Error: .env file not found!${NC}"
    echo "Please run this script from the agentkit directory."
    exit 1
fi

# Step 2: Open Gmail App Password page
echo -e "${YELLOW}Step 1: Get Gmail App Password${NC}\n"
echo "I'm about to open your browser to the Gmail App Password page."
echo "You'll need to:"
echo "  1. Sign in to your Google account"
echo "  2. Select 'Mail' → 'Other (Custom name)'"
echo "  3. Type: 'Resume Automation'"
echo "  4. Click 'Generate'"
echo "  5. Copy the 16-character password"
echo ""
read -p "Press ENTER to open browser..."

# Open browser
open "https://myaccount.google.com/apppasswords" 2>/dev/null || \
xdg-open "https://myaccount.google.com/apppasswords" 2>/dev/null || \
echo "Please manually open: https://myaccount.google.com/apppasswords"

echo ""
echo -e "${GREEN}Browser opened!${NC}"
echo ""
echo "After generating your App Password, come back here."
echo ""

# Step 3: Get the password from user
echo -e "${YELLOW}Step 2: Enter Your App Password${NC}\n"
echo "Paste your 16-character Gmail App Password here."
echo "(It looks like: abcd efgh ijkl mnop)"
echo ""
read -p "Gmail App Password: " GMAIL_APP_PASSWORD

# Remove spaces from password
GMAIL_APP_PASSWORD=$(echo "$GMAIL_APP_PASSWORD" | tr -d ' ')

if [ -z "$GMAIL_APP_PASSWORD" ]; then
    echo -e "\n${RED}❌ Error: No password entered!${NC}"
    exit 1
fi

if [ ${#GMAIL_APP_PASSWORD} -ne 16 ]; then
    echo -e "\n${YELLOW}⚠️  Warning: Password should be 16 characters (without spaces).${NC}"
    echo "You entered: ${#GMAIL_APP_PASSWORD} characters"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [ "$CONTINUE" != "y" ]; then
        echo "Setup cancelled."
        exit 1
    fi
fi

# Step 4: Update .env file
echo ""
echo -e "${YELLOW}Step 3: Updating .env file...${NC}"

# Backup existing .env
cp .env .env.backup
echo "Created backup: .env.backup"

# Update SMTP_PASS in .env
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s/SMTP_PASS=.*/SMTP_PASS=${GMAIL_APP_PASSWORD}/" .env
else
    # Linux
    sed -i "s/SMTP_PASS=.*/SMTP_PASS=${GMAIL_APP_PASSWORD}/" .env
fi

echo -e "${GREEN}✅ .env file updated!${NC}\n"

# Step 5: Verify configuration
echo -e "${YELLOW}Step 4: Verifying configuration...${NC}\n"

SMTP_USER=$(grep "SMTP_USER=" .env | cut -d'=' -f2)
FROM_EMAIL=$(grep "FROM_EMAIL=" .env | cut -d'=' -f2)

echo "Configuration:"
echo "  📧 Email: $SMTP_USER"
echo "  🔐 Password: ✅ Set (hidden)"
echo "  📤 From: $FROM_EMAIL"
echo ""

# Step 6: Test email
echo -e "${YELLOW}Step 5: Test Email Configuration${NC}\n"
echo "Would you like to send a test email to verify everything works?"
read -p "Send test email? (y/n): " SEND_TEST

if [ "$SEND_TEST" = "y" ]; then
    echo ""
    echo "Sending test email..."
    echo ""

    if node test-email.js; then
        echo ""
        echo -e "${GREEN}${BOLD}========================================="
        echo "✅ EMAIL CONFIGURATION COMPLETE!"
        echo -e "=========================================\n${NC}"
        echo "Check your inbox for the test email!"
        echo ""
        echo -e "${BOLD}Next steps:${NC}"
        echo "  1. Start the server: ${GREEN}npm start${NC}"
        echo "  2. Send a test JD from Srinu"
        echo "  3. Watch the automation work! 🎉"
        echo ""
    else
        echo ""
        echo -e "${RED}❌ Test email failed!${NC}"
        echo ""
        echo "Common issues:"
        echo "  1. App Password is incorrect → Generate a new one"
        echo "  2. 2-Step Verification not enabled → Enable it first"
        echo "  3. Network/firewall blocking SMTP"
        echo ""
        echo "Your password has been saved to .env"
        echo "You can try testing again with: ${GREEN}node test-email.js${NC}"
        exit 1
    fi
else
    echo ""
    echo -e "${GREEN}Configuration saved!${NC}"
    echo ""
    echo "You can test later with: ${GREEN}node test-email.js${NC}"
    echo ""
fi

echo -e "${BOLD}=========================================${NC}"
echo "🎉 Setup complete! Your system is ready!"
echo -e "${BOLD}=========================================${NC}\n"
