# Chat Usage Limits with Clerk Upgrade Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow guest chat access with daily limits, and upgrade to higher limits via Clerk sign-in, while tracking usage in SQLite.

**Architecture:** Add a lightweight usage service backed by SQLite (better-sqlite3). Identify guests via a stable visitor cookie (seeded from localStorage) plus hashed IP/UA. Enforce limits in `createSession` and increment message counts via ChatKit `onLog` events posting to a server API. Signed-in users (Clerk `userId`) get higher limits.

**Tech Stack:** Next.js 16, React 19, TypeScript, Clerk, OpenAI ChatKit, better-sqlite3, node:test + tsx loader.

---

### Task 1: Add test runner and a failing usage tier test

**Files:**
- Modify: `package.json`
- Create: `tests/usage/limits.test.ts`

**Step 1: Write failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { selectUsageLimits } from "@/lib/usage/limits";
import { AUTH_LIMITS, FREE_LIMITS } from "@/lib/usage/config";

test("selectUsageLimits returns free limits for guests", () => {
  const result = selectUsageLimits({ isSignedIn: false });
  assert.deepEqual(result, FREE_LIMITS);
});

test("selectUsageLimits returns auth limits for signed-in users", () => {
  const result = selectUsageLimits({ isSignedIn: true });
  assert.deepEqual(result, AUTH_LIMITS);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/usage/limits.test.ts`
Expected: FAIL with "Cannot find module" or "selectUsageLimits is not defined"

**Step 3: Add test runner script and tsx dev dependency**

- Add `"test": "node --test --import tsx"` to scripts
- Add `tsx` to devDependencies

**Step 4: Run test to verify it still fails for missing implementation**

Run: `pnpm test -- tests/usage/limits.test.ts`
Expected: FAIL due to missing module/function

**Step 5: Commit**

```bash
git add package.json tests/usage/limits.test.ts
git commit -m "test: add initial usage tier tests"
```

---

### Task 2: Implement usage config + limits selector

**Files:**
- Create: `lib/usage/config.ts`
- Create: `lib/usage/limits.ts`
- Test: `tests/usage/limits.test.ts`

**Step 1: Write minimal implementation**

```ts
export const FREE_LIMITS = {
  sessionsPerDay: 3,
  messagesPerDay: 20,
  sessionMinutes: 30,
  cooldownHours: 1,
} as const;

export const AUTH_LIMITS = {
  sessionsPerDay: 10,
  messagesPerDay: 50,
  sessionMinutes: 30,
  cooldownHours: 1,
} as const;
```

```ts
import { AUTH_LIMITS, FREE_LIMITS } from "@/lib/usage/config";

export function selectUsageLimits({
  isSignedIn,
}: {
  isSignedIn: boolean;
}) {
  return isSignedIn ? AUTH_LIMITS : FREE_LIMITS;
}
```

**Step 2: Run test to verify it passes**

Run: `pnpm test -- tests/usage/limits.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add lib/usage/config.ts lib/usage/limits.ts
git commit -m "feat: define usage tiers"
```

---

### Task 3: Add SQLite DB helper + migration file

**Files:**
- Create: `lib/db/sqlite.ts`
- Create: `db/migrations/001_usage.sql`
- Create: `lib/db/migrate.ts`
- Test: `tests/db/migrate.test.ts`

**Step 1: Write failing migration test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db/migrate";

test("migrate creates usage tables", () => {
  const db = new Database(":memory:");
  migrate(db);
  const tables = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    .all()
    .map((row) => row.name);
  assert.ok(tables.includes("usage_visitors"));
  assert.ok(tables.includes("usage_sessions"));
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/db/migrate.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement migration + DB helper**

- `lib/db/sqlite.ts`: open db from `USAGE_DB_PATH`, set WAL pragma
- `lib/db/migrate.ts`: load SQL file and `db.exec()`
- `db/migrations/001_usage.sql`: create `usage_visitors`, `usage_sessions` tables and indexes

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/db/migrate.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/db/sqlite.ts lib/db/migrate.ts db/migrations/001_usage.sql tests/db/migrate.test.ts
git commit -m "feat: add usage sqlite schema"
```

---

### Task 4: Implement visitor identity helper

**Files:**
- Create: `lib/usage/identity.ts`
- Test: `tests/usage/identity.test.ts`

**Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildVisitorIdentity } from "@/lib/usage/identity";

test("buildVisitorIdentity prefers clerk user id when present", () => {
  const result = buildVisitorIdentity({
    clerkUserId: "user_123",
    visitorId: "visitor_abc",
    ip: "1.2.3.4",
    userAgent: "ua",
  });

  assert.equal(result.subject, "user_123");
  assert.equal(result.tier, "authenticated");
});

test("buildVisitorIdentity falls back to visitor cookie when guest", () => {
  const result = buildVisitorIdentity({
    clerkUserId: null,
    visitorId: "visitor_abc",
    ip: "1.2.3.4",
    userAgent: "ua",
  });

  assert.equal(result.tier, "guest");
  assert.ok(result.subject.includes("visitor_abc"));
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/usage/identity.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement helper**

- Hash IP + UA with SHA-256
- If `clerkUserId` exists, subject = `clerkUserId`
- Else subject = `visitorId:hash`
- Return `{ subject, tier }`

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/usage/identity.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/usage/identity.ts tests/usage/identity.test.ts
git commit -m "feat: add visitor identity helper"
```

---

### Task 5: Implement usage store functions

**Files:**
- Create: `lib/usage/store.ts`
- Test: `tests/usage/store.test.ts`

**Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";
import { migrate } from "@/lib/db/migrate";
import { createUsageStore } from "@/lib/usage/store";

test("usage store blocks when daily sessions exceeded", () => {
  const db = new Database(":memory:");
  migrate(db);
  const store = createUsageStore(db);

  const subject = "visitor_123";
  store.recordSession({ subject, sessionsPerDay: 1, messagesPerDay: 10 });
  const status = store.getStatus({ subject, sessionsPerDay: 1, messagesPerDay: 10 });

  assert.equal(status.isLimited, true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/usage/store.test.ts`
Expected: FAIL (module not found)

**Step 3: Implement store**

- Add `createUsageStore(db)` returning `getStatus`, `recordSession`, `recordMessage`
- Reset daily counts based on midnight (server TZ)
- Enforce cooldown when sessions exceeded

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/usage/store.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/usage/store.ts tests/usage/store.test.ts
git commit -m "feat: add usage store"
```

---

### Task 6: Add visitor bootstrap component

**Files:**
- Create: `components/usage/VisitorBootstrap.tsx`
- Modify: `app/(portfolio)/layout.tsx`

**Step 1: Add client component**

- On mount, read `localStorage.visitorId` or create UUID
- Set `visitor_id` cookie if missing

**Step 2: Run tests (no tests needed for client-only bootstrap)**

**Step 3: Commit**

```bash
git add components/usage/VisitorBootstrap.tsx app/(portfolio)/layout.tsx
git commit -m "feat: add visitor bootstrap"
```

---

### Task 7: Update create-session server action

**Files:**
- Modify: `app/actions/create-session.ts`
- Test: `tests/usage/session.test.ts`

**Step 1: Write failing test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildSessionPayload } from "@/lib/usage/session";

test("buildSessionPayload includes guest subject", () => {
  const payload = buildSessionPayload({ userId: null, subject: "visitor_123" });
  assert.equal(payload.user, "visitor_123");
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/usage/session.test.ts`
Expected: FAIL

**Step 3: Implement helpers + action**

- Add `lib/usage/session.ts` to create ChatKit payload and map limit errors
- In `createSession`, identify visitor, check store limits, record session, return client secret
- Throw a typed error (e.g. `UsageLimitError`) to handle in UI

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/usage/session.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/actions/create-session.ts lib/usage/session.ts tests/usage/session.test.ts
git commit -m "feat: enforce usage limits in chat sessions"
```

---

### Task 8: Add API routes for usage tracking

**Files:**
- Create: `app/api/chat/usage/route.ts`
- Create: `app/api/chat/message/route.ts`

**Step 1: Write failing tests**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeUsageStatus } from "@/lib/usage/api";

test("normalizeUsageStatus marks limited when sessions exhausted", () => {
  const status = normalizeUsageStatus({ sessionsRemaining: 0, messagesRemaining: 5 });
  assert.equal(status.isLimited, true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/usage/api.test.ts`
Expected: FAIL

**Step 3: Implement routes + helpers**

- `GET /api/chat/usage` returns current status for visitor
- `POST /api/chat/message` increments message count
- Set `export const runtime = "nodejs"`

**Step 4: Run test to verify it passes**

Run: `pnpm test -- tests/usage/api.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/chat/usage/route.ts app/api/chat/message/route.ts lib/usage/api.ts tests/usage/api.test.ts
git commit -m "feat: add usage tracking routes"
```

---

### Task 9: Wire ChatKit UI to usage tracking

**Files:**
- Modify: `components/chat/Chat.tsx`

**Step 1: Add `onLog` handler**

- When `name === "message.send"`, POST to `/api/chat/message`
- Fetch `/api/chat/usage` on mount to show remaining usage (optional state)
- On usage limit error, render CTA and open Clerk sign-in

**Step 2: Manual verification**

- Open chat, send message, verify `/api/chat/message` receives calls

**Step 3: Commit**

```bash
git add components/chat/Chat.tsx
git commit -m "feat: track messages from chat UI"
```

---

### Task 10: Update guest entry points and upgrade CTA

**Files:**
- Modify: `components/SidebarToggle.tsx`
- Modify: `components/sections/ProfileImage.tsx`
- Modify: `components/FloatingDockClient.tsx`

**Step 1: Update toggles**

- Open chat for guests
- When `usage.isLimited`, show Clerk SignIn modal instead

**Step 2: Manual verification**

- Guest can open chat
- After limit reached, SignIn modal appears

**Step 3: Commit**

```bash
git add components/SidebarToggle.tsx components/sections/ProfileImage.tsx components/FloatingDockClient.tsx
git commit -m "feat: allow guest chat with upgrade CTA"
```

---

### Task 11: Update env docs

**Files:**
- Modify: `.vercel.env.example.json`

**Step 1: Add new envs**

- `USAGE_DB_PATH=./data/usage.db`

**Step 2: Commit**

```bash
git add .vercel.env.example.json
git commit -m "docs: add usage db env"
```

---

### Task 12: Manual QA

**Step 1:** Guest usage until 3 sessions

**Step 2:** Confirm limit hit and Clerk SignIn shown

**Step 3:** Sign in and verify 10 sessions/50 messages

---

**Plan complete.**
