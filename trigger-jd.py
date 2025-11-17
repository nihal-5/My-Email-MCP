#!/usr/bin/env python3
"""
Manual trigger for Srinu's latest JD message
Processes the message directly through the orchestrator
"""

import os
import sys

print("🚀 Manual JD Processing Trigger")
print("=" * 50)
print()

# Check if JD text is provided as argument or needs to be input
if len(sys.argv) > 1:
    jd_text = ' '.join(sys.argv[1:])
else:
    print("Paste Srinu's JD message below (press Ctrl+D when done):")
    print("-" * 50)
    jd_text = sys.stdin.read()

if not jd_text or len(jd_text) < 100:
    print("\n❌ JD text too short or empty. Need at least 100 characters.")
    sys.exit(1)

print(f"\n📝 Received JD: {len(jd_text)} characters")
print(f"📄 Preview: {jd_text[:150]}...")
print()

# Set environment variables
os.environ['JD_TEXT'] = jd_text
os.environ['WA_FROM'] = '917702055194@c.us'
os.environ['CC_EMAIL'] = os.getenv('CC_EMAIL', 'nihal.veeramalla@gmail.com')

print("🚀 Processing with NEW spec-based resume generator...")
print()

# Import and run the orchestrator main function
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'orchestrator'))
import main

# The orchestrator will handle the rest
print()
print("✅ Processing complete!")
print()
print("Check:")
print("  📱 WhatsApp for notification")
print("  🌐 http://localhost:3001/approval")
print("  📊 http://10.0.0.138:3001/approval (from phone)")
print()
