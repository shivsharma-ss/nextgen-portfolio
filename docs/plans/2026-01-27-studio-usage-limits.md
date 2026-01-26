# Studio-Controlled Usage Limits Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Give content editors a Studio-backed singleton where they can adjust free and authenticated chat usage limits, and pull those values into the chat usage enforcement pipeline with sensible fallbacks.

**Architecture:** Introduce a new Sanity singleton under a dedicated "AI Chat Settings" folder that stores session/message limits, durations, and cooldowns. Create a Sanity loader in `lib/usage` that fetches and normalizes that document while falling back to defaults, and pass the resulting config into `selectUsageLimits` so every limit check honors the editable values.

**Tech Stack:** Sanity Studio, GROQ queries, `next-sanity` live fetch helper, Next.js server actions, better-sqlite3 usage store, node:test + tsx.

---

### Task 1: Define Studio schema for chat usage limits

**Files:**
- Create: `sanity/schemaTypes/chatUsageLimits.ts`
- Modify: `sanity/schemaTypes/index.ts`

**Steps:**
1. Create schema with `name: "chatUsageLimits"`, title "Chat Usage Limits", type "document", fields for free/auth session/message limits, session duration, cooldown.
2. Each field should be `defineField({ type: "number", validation: (Rule) => Rule.required().min(1).max(1000) })` with descriptive help text.
3. Set `initialValue` to current defaults (free: 3 sessions/20 messages; auth: 10 sessions/50 messages; sessionMinutes: 30; cooldownHours: 1).
4. Register the schema inside `sanity/schemaTypes/index.ts`.

### Task 2: Add Studio structure entry under a dedicated settings folder

**Files:**
- Modify: `sanity/structure.ts`

**Steps:**
1. Add a new top-level list item titled "AI Chat Settings" with an appropriate icon.
2. Nest the singleton document inside with `S.document().schemaType("chatUsageLimits").documentId("singleton-chatUsageLimits")`.
3. Keep other navigation entries unchanged so the new folder sits alongside existing singletons.

### Task 3: Create Sanity loader and normalization helper

**Files:**
- Create: `lib/usage/sanityConfig.ts`
- Modify: `lib/usage/config.ts`
- Modify: `lib/usage/limits.ts`

**Steps:**
1. `lib/usage/sanityConfig.ts`: export `fetchUsageLimitsConfig({ revalidate = 60 } = {})` that reads `/chatUsageLimits` by document ID using `sanityFetch`, returning the raw field values.
2. Add `normalizeUsageLimits(raw)` that merges raw values with the existing defaults, ensuring every numeric field is `Math.max(1, Number(rawValue) || defaultValue)`.
3. Update `lib/usage/config.ts` to export the defaults plus `loadUsageLimitsConfig()` that composes the fetch + normalize helpers.
4. Replace `selectUsageLimits({ isSignedIn })` with a signature `selectUsageLimits({ isSignedIn, config })`, defaulting to the normalized config if none is passed so sites with static limits continue to work.

**Tests:**
- Create: `tests/usage/limits-config.test.ts` to verify normalization handles full/partial/missing data.
- Run: `pnpm test -- tests/usage/limits-config.test.ts`

### Task 4: Hook dynamic limits into server actions and APIs

**Files:**
- Modify: `app/actions/create-session.ts`
- Modify: `app/api/chat/usage/route.ts`
- Modify: `app/api/chat/message/route.ts`

**Steps:**
1. At the top of each file, import `loadUsageLimitsConfig` and call it once per request before enforcing limits.
2. Pass the resulting config object into `selectUsageLimits` so all limit checks use Studio values.
3. Wrap the loader call in try/catch to log (if desired) and fall back to defaults on failure.

**Tests:**
- Update `tests/api/usage-config.test.ts` to mock `loadUsageLimitsConfig` and assert the computed limits are used when the document defines custom values.
- Run: `pnpm test -- tests/api/usage-config.test.ts`

### Task 5: Document the new workflow

**Files:**
- Modify: `MANUAL_QA_PLAYBOOK.md`
- Modify: `QA_IMPLEMENTATION_SUMMARY.md`

**Steps:**
1. Add instructions to edit the new “Chat Usage Limits” document in Studio and publish changes. Mention the revalidation window for Next.js to pick up the new values.
2. Update verification steps/checklists to include testing the new limits after editing them.

### Task 6: Regenerate Sanity type definitions (if applicable)

**Files/Commands:**
- Run: `pnpm sanity typegen`

**Steps:**
1. Execute the typegen command after the new schema is added.
2. Include any generated file updates in the changelist.

---

Plan complete and saved. Two execution options:
1. Subagent-Driven (this session)
2. Parallel Session (separate)
Which approach?
