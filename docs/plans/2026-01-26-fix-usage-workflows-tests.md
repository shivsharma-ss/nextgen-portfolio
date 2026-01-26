# Fix Usage + Workflow + Tests Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align workflow configs, usage endpoint docs, and usage/identity/store behavior with safer defaults and robust tests, plus convert the QA test into a real Puppeteer e2e.

**Architecture:** Keep API endpoints canonical at `/api/chat/usage`, tighten identity hashing around a private salt, and make usage writes transactional. Tests shift from tautological assertions to real sources of truth. Puppeteer e2e exercises the guest + auth flow against a running Next server.

**Tech Stack:** Next.js (App Router), Node test runner, better-sqlite3, Puppeteer, GitHub Actions YAML.

---

### Task 1: Fix deploy-and-promote workflow env + deploy URL extraction

**Files:**
- Modify: `.github/workflows/deploy-and-promote.yml:44-76`

**Step 1: Update workflow variables**
- Replace hardcoded `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` with `${{ vars.VERCEL_ORG_ID }}` and `${{ vars.VERCEL_PROJECT_ID }}` in the env export block.

**Step 2: Introduce project-name variable**
- Add `PROJECT_NAME` (or `INPUT_PROJECT_NAME`) near the deploy step (env or local variable) and use it in both grep regexes when building `DEPLOY_URL`.
- Remove extra indentation before the two `echo` lines to align with the rest of the script.

**Step 3: Sanity check**
- Ensure fallback logic and error handling around `DEPLOY_URL` remain intact.

---

### Task 2: Fix manage-domain verification grep + error handling

**Files:**
- Modify: `.github/workflows/manage-domain.yml:75-79`

**Step 1: Update grep to use $DOMAIN**
- Replace `grep shivansh-sharma` with `grep "$DOMAIN"`.

**Step 2: Add explicit failure**
- Capture grep exit code; if non-zero, echo `Domain $DOMAIN not found in Vercel aliases` and `exit 1`.

---

### Task 3: Canonicalize usage endpoint across docs/tests

**Files:**
- Modify: `README.md:220-230`
- Modify: `docs/MANUAL_QA_PLAYBOOK.md:36-45`, `docs/MANUAL_QA_PLAYBOOK.md:126-145`
- Modify: `docs/QA_IMPLEMENTATION_SUMMARY.md:50-55`
- Modify: `tests/api/usage-config.test.ts:79-89`
- Verify: `app/api/chat/usage/route.ts`

**Step 1: Update docs**
- Replace `/app/api/chat/usage` and `/api/usage/status` with `/api/chat/usage` in README and QA docs.

**Step 2: Make the API route test real**
```ts
// tests/api/usage-config.test.ts
const expectedApiRoutes = [
  "/api/chat/create-session",
  "/api/chat/send-message",
  "/api/chat/usage",
];

expectedApiRoutes.forEach((route) => {
  const routePath = route.replace("/api", "app/api");
  const filePath = path.join(process.cwd(), routePath, "route.ts");
  assert.ok(existsSync(filePath), `Missing route file for ${route}`);
});
```

**Step 3: Verify actual route**
- Confirm `app/api/chat/usage/route.ts` exists and aligns with `/api/chat/usage`.

---

### Task 4: Convert QA e2e to real Puppeteer flow

**Files:**
- Modify: `tests/e2e/usage-limits-qa.test.ts`

**Step 1: Write failing Puppeteer test**
```ts
test("Manual QA Flow Validation: Usage Limits and Authentication", async () => {
  const { server, url } = await startNextServer();
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle0" });
  // Open chat, send messages, assert usage banner/CTA.
  // If CLERK_E2E_EMAIL/PASSWORD set, sign in and verify higher limits.

  await browser.close();
  await server.stop();
});
```

**Step 2: Implement test helpers**
- Add a small helper in the test file to start Next (child_process spawn of `next dev` or `next start`) and return base URL.
- Add environment-gated Clerk login flow; if creds are missing, skip auth portion with `test.skip()` or `if (!process.env...) return;`.

**Step 3: Make test green**
- Implement selectors/assertions aligned with real UI (usage banner, sign-in CTA, etc.).

---

### Task 5: Remove redundant onKeyDown in FloatingDockClient

**Files:**
- Modify: `components/FloatingDockClient.tsx:82-93`

**Step 1: Update JSX**
- Remove the `onKeyDown` prop from the `<button>` inside `item.isSignInButton`.

---

### Task 6: Guard fetchUsageStatus IIFEs in Chat

**Files:**
- Modify: `components/chat/Chat.tsx:71-83`
- Modify: `components/chat/Chat.tsx:155-163`

**Step 1: Write failing test (if adding test harness)**
- Add a test that simulates `fetchUsageStatus` throwing and assert it is caught (no unhandled rejection).

**Step 2: Implement try/catch**
```ts
try {
  const payload = await fetchUsageStatus(...);
  if (!payload || controller.signal.aborted || !isMountedRef.current) return;
  setUsage(payload);
} catch (error) {
  if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) return;
  console.warn("Usage fetch failed", error);
}
```

---

### Task 7: Log non-abort errors in ProfileImage usage fetch

**Files:**
- Modify: `components/sections/ProfileImage.tsx:37-53`

**Step 1: Add error state or log**
```ts
const [usageError, setUsageError] = useState<Error | null>(null);
...
} catch (error) {
  if (controller.signal.aborted) return;
  if (error instanceof DOMException && error.name === "AbortError") return;
  console.error(error);
  setUsageError(error instanceof Error ? error : new Error("Usage fetch failed"));
}
```

**Step 2: Surface error**
- Optionally adapt `title`/`tooltipText` to reflect `usageError`.

---

### Task 8: Remove PRAGMA from migration and ensure connection sets FK

**Files:**
- Modify: `db/migrations/001_usage.sql:1`
- Verify: `lib/db/sqlite.ts:13-18`

**Step 1: Remove migration PRAGMA**
- Delete `PRAGMA foreign_keys = ON;` from the migration file.

**Step 2: Verify `openUsageDb` still enables FK**
- Ensure `db.pragma("foreign_keys = ON")` remains in `openUsageDb()`.

---

### Task 9: Tighten resolveUsageSalt + trim IP in identity

**Files:**
- Modify: `lib/usage/identity.ts:18-42`
- Modify: `tests/usage/identity.test.ts:8-120`

**Step 1: Write failing tests**
```ts
test("resolveUsageSalt throws in production when missing", () => {
  withEnv({ USAGE_SALT: undefined }, () => {
    process.env.NODE_ENV = "production";
    assert.throws(() => hashVisitorFingerprint("x", "ua"));
  });
});

test("buildVisitorIdentity trims ip before hashing", () => {
  withEnv({ USAGE_SALT: "usage-salt" }, () => {
    const identity = buildVisitorIdentity({ ip: " 203.0.113.5 ", userAgent: "ua", visitorId: "v" });
    const expected = hashVisitorFingerprint("203.0.113.5", "ua");
    assert.equal(identity.subject, expected);
  });
});
```

**Step 2: Implement resolveUsageSalt**
```ts
const resolveUsageSalt = () => {
  if (process.env.USAGE_SALT) return process.env.USAGE_SALT;
  if (process.env.NODE_ENV !== "production") return "dev-usage-salt";
  throw new Error("USAGE_SALT is required in production");
};
```

**Step 3: Trim IP consistently**
```ts
const trimmedIp = ip.trim();
const subjectSeed = trimmedIp === "" ? visitorId : trimmedIp;
```

---

### Task 10: Wire revalidate through sanityFetch

**Files:**
- Modify: `lib/usage/sanityConfig.ts:22-25`

**Step 1: Update sanityFetch call**
```ts
const { data } = await sanityFetch({
  query,
  params: { id: "singleton-chatUsageLimits" },
  revalidate,
});
```

---

### Task 11: Make recordSession and recordMessage transactional

**Files:**
- Modify: `lib/usage/store.ts:99-123`
- Modify: `tests/usage/store.test.ts:40-90`

**Step 1: Write failing tests**
```ts
test("recordSession uses a transaction", (t) => {
  const db = new Database(":memory:");
  migrateUsageDb({ db });
  let usedTransaction = false;
  const original = db.transaction.bind(db);
  t.mock.method(db, "transaction", (fn: any) => {
    usedTransaction = true;
    return original(fn);
  });
  const store = createUsageStore(db);
  store.recordSession({ subject: "v", sessionsPerDay: 1, messagesPerDay: 1 });
  assert.ok(usedTransaction);
  db.close();
});

test("recordMessage uses a transaction", (t) => {
  const db = new Database(":memory:");
  migrateUsageDb({ db });
  let usedTransaction = false;
  const original = db.transaction.bind(db);
  t.mock.method(db, "transaction", (fn: any) => {
    usedTransaction = true;
    return original(fn);
  });
  const store = createUsageStore(db);
  store.recordMessage({ subject: "v", messagesPerDay: 1 });
  assert.ok(usedTransaction);
  db.close();
});
```

**Step 2: Implement transactional logic**
```ts
const recordSession = db.transaction((input: SessionInput) => {
  const now = getNowSeconds();
  ensureVisitor.run(input.subject, now, now);
  const status = getStatus({
    subject: input.subject,
    sessionsPerDay: input.sessionsPerDay,
    messagesPerDay: input.messagesPerDay,
  });
  if (status.isSessionBlocked) return;
  insertUsage.run(randomUUID(), input.subject, "session", now);
});
```

```ts
const recordMessage = db.transaction((input: MessageInput) => {
  const now = getNowSeconds();
  ensureVisitor.run(input.subject, now, now);
  const status = getStatus({
    subject: input.subject,
    sessionsPerDay: Number.MAX_SAFE_INTEGER,
    messagesPerDay: input.messagesPerDay,
  });
  if (status.isMessageBlocked) return;
  insertUsage.run(randomUUID(), input.subject, "message", now);
});
```

---

### Task 12: Fix tests around migrations, middleware, and env isolation

**Files:**
- Modify: `tests/db/migrate.test.ts:10-70`
- Modify: `tests/middleware-analysis.test.ts:6-85`
- Modify: `tests/middleware.test.ts:1-83`
- Modify: `tests/new-middleware.test.ts:5-136`

**Step 1: Restore env in migrate tests**
- Save original `USAGE_DB_PATH`, restore in `finally` (delete if undefined).

**Step 2: Avoid renaming real migration file**
- Mock `readFileSync` to throw and assert `migrateUsageDb` closes the db.

**Step 3: Fix middleware-analysis env clone + cache reset**
- Replace `const originalEnv = process.env;` with a clone.
- Clear proxy module cache before dynamic import.
- Replace try/catch with `assert.rejects`.
- Replace placeholder test with `test.todo(...)`.

**Step 4: Fix middleware.test imports + safety checks**
- Import `createSession` and call it twice under mocked `global.fetch`.
- Use try/finally to restore `global.fetch` and env keys.
- Replace `matcher[0]` access with `matcher.find(...)` or guard.

**Step 5: Fix new-middleware tests**
- Save/restore Clerk env vars in finally.
- Clear module cache *before* import.
- Replace `assert.ok(true)` with real assertion on response or no-throw.
- Restore `global.fetch` in `createSession` test.

---

### Task 13: Fix usage-config “Manual Testing Data Validation” test

**Files:**
- Modify: `tests/api/usage-config.test.ts:94-165`

**Step 1: Replace tautological literals**
- Import real config/constants and assert against them instead of the same literals used to build test data.

---

### Task 14: Fix usage store test midnight race

**Files:**
- Modify: `tests/usage/store.test.ts:13-86`

**Step 1: Precompute expected cooldown**
```ts
const expectedCooldown = getStartOfNextDay();
store.recordSession(input);
...
assert.equal(status.cooldownEndsAt, expectedCooldown);
```

---

### Task 15: Run targeted tests

**Step 1: Usage identity tests**
Run: `npm test -- tests/usage/identity.test.ts`

**Step 2: Usage store tests**
Run: `npm test -- tests/usage/store.test.ts`

**Step 3: API config tests**
Run: `npm test -- tests/api/usage-config.test.ts`

**Step 4: Middleware tests**
Run: `npm test -- tests/middleware-analysis.test.ts tests/middleware.test.ts tests/new-middleware.test.ts`

**Step 5: E2E test**
Run: `npm test -- tests/e2e/usage-limits-qa.test.ts`
