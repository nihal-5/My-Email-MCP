#!/bin/bash
# Quick test script - run this after WhatsApp finishes initializing

echo "🔍 Checking if MCP server is ready..."
if lsof -i :3000 > /dev/null 2>&1; then
    echo "✅ MCP server is running on port 3000"
else
    echo "❌ MCP server not ready yet - wait a bit longer"
    exit 1
fi

echo ""
echo "🚀 Triggering latest JD test..."
node trigger-latest-jd.js

echo ""
echo "📧 Checking generated email..."
cat data/approval-queue.json | jq '.[-1].emailBody' -r | head -30

echo ""
echo "✅ Check above for:"
echo "   1. Should say 'Thank you for reaching out' (NOT 'I came across')"
echo "   2. Should NOT have '**APPLICATION DETAILS:**' section"
