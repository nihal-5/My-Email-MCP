#!/bin/bash

# Resume Automation System - Test Script
# This script helps you verify all components are working

set -e

echo "========================================="
echo "Resume Automation System - Test Script"
echo "========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if server is running
echo "Step 1: Checking if MCP server is running..."
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running!${NC}"
    SERVER_RUNNING=true
else
    echo -e "${YELLOW}⚠️  Server is not running${NC}"
    echo "Start it with: npm start"
    SERVER_RUNNING=false
fi
echo ""

# Test 2: Check Python dependencies
echo "Step 2: Checking Python dependencies..."
if python3 -c "import langgraph, langchain, requests" 2>/dev/null; then
    echo -e "${GREEN}✅ Python dependencies installed!${NC}"
else
    echo -e "${RED}❌ Missing Python dependencies${NC}"
    echo "Install with: uv pip install langgraph langchain requests"
fi
echo ""

# Test 3: Check tectonic
echo "Step 3: Checking tectonic (LaTeX compiler)..."
if which tectonic > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Tectonic installed!${NC}"
    tectonic --version
else
    echo -e "${RED}❌ Tectonic not found${NC}"
    echo "Install with: brew install tectonic"
fi
echo ""

# Test 4: Check Node build
echo "Step 4: Checking TypeScript build..."
if [ -d "dist" ]; then
    echo -e "${GREEN}✅ Project built successfully!${NC}"
else
    echo -e "${YELLOW}⚠️  Project not built${NC}"
    echo "Build with: npm run build"
fi
echo ""

# Test 5: Check .env configuration
echo "Step 5: Checking .env configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file exists${NC}"

    if grep -q "SMTP_PASS=YOUR_GMAIL_APP_PASSWORD_HERE" .env; then
        echo -e "${YELLOW}⚠️  Gmail App Password not configured${NC}"
        echo "Update SMTP_PASS in .env with your Gmail App Password"
    else
        echo -e "${GREEN}✅ SMTP configured${NC}"
    fi
else
    echo -e "${RED}❌ .env file missing${NC}"
    echo "Copy from: cp .env.example .env"
fi
echo ""

# Test 6: Check resume template
echo "Step 6: Checking resume template..."
if [ -f "src/resume-tools/templates/resume.tex.tmpl" ]; then
    echo -e "${GREEN}✅ Resume template found!${NC}"
else
    echo -e "${RED}❌ Resume template missing${NC}"
fi
echo ""

# Test 7: Test MCP tools (if server running)
if [ "$SERVER_RUNNING" = true ]; then
    echo "Step 7: Testing MCP tools..."

    echo "Testing parse_jd tool..."
    RESULT=$(curl -s -X POST http://localhost:3000/execute \
      -H "Content-Type: application/json" \
      -d '{
        "tool": "parse_jd",
        "params": {
          "jd": "Role: ML Engineer\nLocation: Dallas, TX\nAzure ML, Python\nContact: test@fiserv.com"
        }
      }')

    if echo "$RESULT" | grep -q "ML Engineer"; then
        echo -e "${GREEN}✅ parse_jd tool working!${NC}"
    else
        echo -e "${RED}❌ parse_jd tool failed${NC}"
        echo "Response: $RESULT"
    fi
else
    echo "Step 7: Skipping MCP tools test (server not running)"
fi
echo ""

# Summary
echo "========================================="
echo "Test Summary"
echo "========================================="
echo ""

if [ "$SERVER_RUNNING" = true ]; then
    echo -e "${GREEN}Server Status: Running ✅${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Configure Gmail App Password in .env (if not done)"
    echo "2. Send a test JD from Srinu's WhatsApp: +91 7702055194"
    echo "3. Watch the console for processing logs"
    echo "4. Check ./outbox/ for generated PDFs"
    echo ""
    echo "Or manually test with:"
    echo "  python3 orchestrator/main.py"
    echo ""
else
    echo -e "${YELLOW}Server Status: Not Running ⚠️${NC}"
    echo ""
    echo "Start the server:"
    echo "  cd /Users/nihalveeramalla/projects/agentkit"
    echo "  npm start"
    echo ""
fi

echo "========================================="
echo "Full documentation: QUICK_START.md"
echo "========================================="
