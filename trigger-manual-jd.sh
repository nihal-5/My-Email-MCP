#!/bin/bash
# Simple manual trigger - paste Srinu's JD message when prompted

echo "🚀 Manual JD Processing Trigger"
echo "================================"
echo ""
echo "This will process a JD message using the NEW spec-based resume generator!"
echo ""
echo "Paste Srinu's JD message below, then press Ctrl+D (or Enter twice):"
echo ""

# Read multi-line input
JD_TEXT=$(cat)

if [ -z "$JD_TEXT" ]; then
    echo "❌ No JD text provided. Exiting."
    exit 1
fi

echo ""
echo "📝 Received JD (${#JD_TEXT} characters)"
echo ""
echo "🚀 Triggering resume generation with spec-based system..."
echo ""

# Set environment and run orchestrator
export JD_TEXT="$JD_TEXT"
export WA_FROM="917702055194@c.us"
export CC_EMAIL="nihal.veeramalla@gmail.com"

python3 ./orchestrator/main.py

echo ""
echo "✅ Done! Check:"
echo "   📱 WhatsApp for notification"
echo "   🌐 http://localhost:3001/approval"
echo "   📊 http://10.0.0.138:3001/approval (from phone)"
echo ""
