# Manual QA Playbook: Usage Limits and Authentication Flow

## Overview
This playbook provides step-by-step instructions for manually testing the usage limits and authentication flow in the NextGen Portfolio application.

## Prerequisites
- Local development server running (`npm run dev`)
- Clerk authentication configured
- Database with usage tracking enabled

## Test Environment Setup

### 1. Clear Browser Data
**Goal**: Simulate a new visitor with no previous usage data

**Steps**:
1. Open browser developer tools (F12)
2. Go to Application tab
3. Clear:
   - Local Storage
   - Session Storage
   - Cookies (for localhost)
4. Refresh the page

**Verification**:
- ✅ Page loads as fresh visitor
- ✅ No user signed in (guest state)

## Step 1.5: ⚙️ Adjust Usage Limits in Studio

**Goal**: Verify editors can change the chat limits via Studio and the site honors the new values.

**Steps**:
1. Open the Sanity Studio at `http://localhost:3333` (or your configured URL).
2. Navigate to **AI Chat Settings > Chat Usage Limits** and adjust the numeric fields.
3. Publish the document and wait ~60 seconds for the Next.js revalidation window.
4. Refresh the public site and then continue with the remaining tests.

**Verification**:
- ✅ `/api/usage/status` reflects the updated limits in the response payload.
- ✅ Guests/authenticated users observe the new session and message quotas.
- ✅ The fallback to default limits (3/20 for guests, 10/50 for auth) still applies when the document is unpublished or invalid.

## Step 2: Test Free User Limits

### 2.1 Chat Sessions Within Free Limit (3 sessions)
**Goal**: Verify free users can create up to 3 sessions

**Steps**:
1. Locate and click the chat button
2. Send a message to start Session 1
3. Verify session starts successfully
4. Close/end the session
5. Repeat for Session 2
6. Repeat for Session 3

**Verification**:
- ✅ All 3 sessions start successfully
- ✅ Messages are processed without limits
- ✅ Session tracking works (check network calls to usage endpoints)

### 2.2 Test Session Limit Enforcement
**Goal**: Verify 4th session triggers limit message

**Steps**:
1. Attempt to start Session 4
2. Observe the UI response

**Expected Behavior**:
- ❌ Session 4 should NOT start
- ✅ Usage limit message appears
- ✅ Call-to-action (CTA) to sign up/sign in is shown

**UI Elements to Check**:
- `[data-testid="usage-limit-message"]` - should display limit message
- `[data-testid="sign-in-cta"]` - should show sign-in prompt
- Chat button should be disabled or show limit state

## Step 3: Test Authentication

### 3.1 Sign In via Clerk
**Goal**: Authenticate user and upgrade limits

**Steps**:
1. Click on the sign-in button/CTA
2. Use test credentials or mock authentication
3. Complete Clerk sign-in flow

**Verification**:
- ✅ User is signed in (check user profile/avatar)
- ✅ User state changes from guest to authenticated
- ✅ LocalStorage/cookies contain auth tokens

## Step 4: Test Authenticated User Limits

### 4.1 Higher Session Limits (10 sessions)
**Goal**: Verify authenticated users can create more sessions

**Steps**:
1. Try to start a new chat session (should now work)
2. Create sessions 4, 5, 6, 7, 8, 9, 10
3. Verify each session works correctly

**Verification**:
- ✅ All 10 sessions start successfully
- ✅ Previous limit no longer applies
- ✅ Usage tracking continues with higher limits

### 4.2 Test Message Limits (50 messages)
**Goal**: Verify message limits are correctly enforced

**Steps**:
1. In a single session, send multiple messages
2. Continue until approaching 50 messages
3. Test limit behavior

**Verification**:
- ✅ Up to 50 messages are processed
- ✅ Message limit is enforced appropriately
- ✅ Clear indication when message limit is reached

## Step 5: API and Backend Verification

### 5.1 Usage Tracking Endpoints
**Goal**: Verify backend correctly tracks and enforces limits

**Network Request Checks** (use browser DevTools Network tab):

**For Guests**:
```
POST /api/chat/create-session
GET /api/usage/status
```

**Expected Responses**:
- After 3 sessions: Status shows `isSessionBlocked: true`
- Session 4 attempt: Returns 429 or usage limit error

**For Authenticated Users**:
```
POST /api/chat/create-session (with auth headers)
GET /api/usage/status
```

**Expected Responses**:
- Status shows higher limits (10 sessions, 50 messages)
- `isSessionBlocked: false` until 10 sessions used

### 5.2 Database Verification
**Goal**: Ensure usage data is correctly stored

**Optional** - If database access available:
```sql
SELECT * FROM usage_sessions WHERE subject = 'visitor-id' ORDER BY created_at DESC;
SELECT * FROM usage_messages WHERE subject = 'visitor-id' ORDER BY created_at DESC;
```

**Verification**:
- ✅ Session counts match limits
- ✅ Message counts are tracked
- ✅ Timestamps and cooldown periods work

## Step 6: Edge Cases and Error Handling

### 6.1 Browser Refresh/Navigation
**Steps**:
1. Start a session
2. Refresh the page
3. Try to continue or start new session

**Expected**: Usage state persists correctly

### 6.2 Multiple Tabs
**Steps**:
1. Open app in multiple tabs
2. Start sessions in different tabs
3. Verify limits are respected across tabs

### 6.3 Sign Out
**Steps**:
1. Use authenticated sessions
2. Sign out
3. Try to continue using the app

**Expected**: Reverts to free limits immediately

## Step 7: Performance and UX

### 7.1 Responsiveness
**Checks**:
- Usage limit messages appear instantly
- No lag when switching between free/auth states
- Smooth transitions in UI

### 7.2 Error States
**Network Issues**:
- Test what happens when usage endpoints fail
- Verify graceful degradation
- Check for appropriate error messages

## Automation Opportunities

This manual QA flow can be enhanced with:

1. **Puppeteer/Playwright** scripts for automated testing
2. **Cypress** e2e tests for complete flow coverage
3. **API tests** using Jest/Vitest for backend validation
4. **Load testing** with tools like Artillery or K6

## Test Results Checklist

### Free User Flow
- [ ] Browser data cleared successfully
- [ ] Session 1, 2, 3 work correctly
- [ ] Session 4 blocked with proper messaging
- [ ] Sign-in CTA displayed
- [ ] Network requests show correct responses

### Authenticated User Flow  
- [ ] Sign-in completes successfully
- [ ] Sessions 4-10 work correctly
- [ ] Message limits enforced (up to 50)
- [ ] Usage status reflects higher limits
- [ ] Network requests include auth headers

### Edge Cases
- [ ] Browser refresh maintains state
- [ ] Multiple tabs respect limits
- [ ] Sign out reverts to free limits
- [ ] Network errors handled gracefully

### UI/UX
- [ ] Clear indication of remaining usage
- [ ] Helpful error messages
- [ ] Smooth transitions between states
- [ ] Mobile responsive design works

---

**Note**: This playbook should be run after each deployment that affects usage limits or authentication logic. Document any deviations from expected behavior for developer review.
