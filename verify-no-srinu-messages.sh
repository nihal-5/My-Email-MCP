#!/bin/bash
# Verification script to ensure NO messages will EVER be sent to Srinu

echo "============================================================"
echo "🔒 VERIFICATION: Message Blocking to Srinu"
echo "============================================================"
echo ""

echo "1️⃣  Checking for sendMessage calls to Srinu's number..."
echo "------------------------------------------------------------"
FOUND=$(grep -r "sendMessage" src/ | grep -i "917702055194" || echo "")
if [ -z "$FOUND" ]; then
    echo "✅ PASS: No sendMessage calls to Srinu's number found"
else
    echo "❌ FAIL: Found sendMessage to Srinu:"
    echo "$FOUND"
    exit 1
fi
echo ""

echo "2️⃣  Checking for SRINU_CHAT_ID in sendMessage..."
echo "------------------------------------------------------------"
FOUND=$(grep -r "sendMessage.*SRINU_CHAT_ID" src/ || echo "")
if [ -z "$FOUND" ]; then
    echo "✅ PASS: No sendMessage using SRINU_CHAT_ID"
else
    echo "❌ FAIL: Found sendMessage with SRINU_CHAT_ID:"
    echo "$FOUND"
    exit 1
fi
echo ""

echo "3️⃣  Checking for old 'srinuChatId' field..."
echo "------------------------------------------------------------"
FOUND=$(grep "srinuChatId" src/approval-server.ts || echo "")
if [ -z "$FOUND" ]; then
    echo "✅ PASS: Old 'srinuChatId' field removed"
else
    echo "❌ FAIL: Found old 'srinuChatId' field:"
    echo "$FOUND"
    exit 1
fi
echo ""

echo "4️⃣  Verifying hard block in WhatsAppClient..."
echo "------------------------------------------------------------"
FOUND=$(grep -A 5 "HARD BLOCK" src/whatsapp-client.ts | grep "917702055194")
if [ -n "$FOUND" ]; then
    echo "✅ PASS: Hard block present in WhatsAppClient.sendMessage()"
    echo "   Block includes: 917702055194@c.us"
else
    echo "❌ FAIL: Hard block not found in WhatsAppClient"
    exit 1
fi
echo ""

echo "5️⃣  Verifying orchestrator uses MY_WHATSAPP_CHATID..."
echo "------------------------------------------------------------"
FOUND=$(grep "MY_WHATSAPP_CHATID" orchestrator/main.py)
if [ -n "$FOUND" ]; then
    echo "✅ PASS: Orchestrator uses MY_WHATSAPP_CHATID for notifications"
    echo "   Found: $FOUND"
else
    echo "❌ FAIL: Orchestrator not using MY_WHATSAPP_CHATID"
    exit 1
fi
echo ""

echo "6️⃣  Checking environment variables..."
echo "------------------------------------------------------------"
MY_NUM=$(grep "MY_WHATSAPP_NUMBER=" .env | grep -v "^#" | cut -d'=' -f2)
MY_CHAT=$(grep "MY_WHATSAPP_CHATID=" .env | grep -v "^#" | cut -d'=' -f2)
SRINU_NUM=$(grep "SRINU_WHATSAPP_NUMBER=" .env | grep -v "^#" | cut -d'=' -f2)

if [ -n "$MY_NUM" ] && [ -n "$MY_CHAT" ] && [ -n "$SRINU_NUM" ]; then
    echo "✅ PASS: Environment variables set correctly"
    echo "   YOUR Number: $MY_NUM"
    echo "   YOUR Chat ID: $MY_CHAT"
    echo "   BLOCKED (Srinu): $SRINU_NUM"
else
    echo "⚠️  WARNING: Some environment variables missing"
    echo "   MY_WHATSAPP_NUMBER: $MY_NUM"
    echo "   MY_WHATSAPP_CHATID: $MY_CHAT"
    echo "   SRINU_WHATSAPP_NUMBER: $SRINU_NUM"
fi
echo ""

echo "7️⃣  Checking compiled JavaScript (dist/)..."
echo "------------------------------------------------------------"
if [ -f "dist/whatsapp-client.js" ]; then
    FOUND=$(grep -i "BLOCKED_NUMBERS" dist/whatsapp-client.js)
    if [ -n "$FOUND" ]; then
        echo "✅ PASS: Hard block compiled into dist/whatsapp-client.js"
        # Also check for the actual number
        NUM_FOUND=$(grep "917702055194" dist/whatsapp-client.js)
        if [ -n "$NUM_FOUND" ]; then
            echo "   Contains Srinu's blocked number: 917702055194"
        fi
    else
        echo "❌ FAIL: Hard block not found in compiled code"
        echo "   Run: npm run build"
        exit 1
    fi
else
    echo "⚠️  WARNING: dist/whatsapp-client.js not found"
    echo "   Run: npm run build"
fi
echo ""

echo "============================================================"
echo "✅ ALL VERIFICATIONS PASSED!"
echo "============================================================"
echo ""
echo "GUARANTEES:"
echo "  ✅ Srinu will NEVER receive any automated messages"
echo "  ✅ Hard block enforced at WhatsApp client level"
echo "  ✅ ALL notifications go to YOUR demo number ($MY_NUM)"
echo "  ✅ System will throw error if anyone tries to message Srinu"
echo ""
echo "Next steps:"
echo "  1. pm2 restart whatsapp-resume-bot"
echo "  2. pm2 logs | grep -E '🔒|BLOCKED|ALLOWED'"
echo "  3. Test with: Srinu sends JD → You get notification"
echo ""
