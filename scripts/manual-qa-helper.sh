#!/bin/bash

# Manual QA Helper Script for Usage Limits Testing
# This script sets up the environment and provides guided instructions

set -e

echo "🚀 Starting Manual QA Helper for Usage Limits"
echo "=========================================="

# Check if dev server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Error: Development server is not running at http://localhost:3000"
    echo "Please run 'npm run dev' in another terminal first"
    exit 1
fi

echo "✅ Development server is running"
echo ""

# Open browser with isolated profile if available
if command -v google-chrome &> /dev/null; then
    echo "🌐 Opening Chrome in incognito mode for testing..."
    google-chrome --incognito --new-window http://localhost:3000
elif command -v open &> /dev/null; then
    echo "🌐 Opening browser..."
    open -a "Google Chrome" --args --incognito http://localhost:3000
else
    echo "🌐 Please manually open http://localhost:3000 in an incognito/private window"
fi

echo ""
echo "📋 Manual Testing Checklist:"
echo "==========================="
echo ""

# Display step-by-step instructions
cat << 'EOF'
Step 1: 🧹 Clear Browser Data
- Open DevTools (F12)
- Go to Application tab
- Clear Local Storage, Session Storage, Cookies
- Refresh page

Step 2: 💬 Test Free User Sessions (limit: 3)
- Click chat button and start Session 1
- Send: "Hello, this is my first message"
- End session
- Repeat for Session 2 and 3
- All 3 should work ✅

Step 3: 🚫 Test Limit Enforcement
- Try to start Session 4
- Should show usage limit message ❌
- Should display sign-in CTA

Step 4: 🔐 Test Authentication
- Click sign-in button/CTA
- Complete Clerk sign-in
- Verify user is authenticated

Step 5: ✅ Test Authenticated Limits (limit: 10)
- Try starting new chat sessions
- Should be able to create sessions 4-10
- Test message limits (up to 50 messages)

API Verification:
- Open DevTools Network tab
- Look for calls to:
  * /api/chat/create-session
  * /api/chat/usage
- Verify responses include correct limits

Expected Behaviors:
- Free users: 3 sessions, 20 messages
- Auth users: 10 sessions, 50 messages
- Limits reset daily
- Clear error messages

EOF

echo ""
echo "📖 For detailed instructions, see: MANUAL_QA_PLAYBOOK.md"
echo ""
echo "❓ Need help? Check the Network tab in DevTools for API calls"
echo ""
echo "Happy testing! 🎯"
