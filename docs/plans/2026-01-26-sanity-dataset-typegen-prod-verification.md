# Sanity Dataset + Typegen + Production Verification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Update Sanity CLI to target `mdokvla9/develop`, regenerate schema/typegen outputs, refresh README with the new CMS surface, ensure no secrets leak, push the updated branch, and verify production & studio deployments via DevTools + agent-browser.

**Architecture:** Keep environment overrides authoritative for project/dataset selection, run the `pnpm typegen` script under those overrides to regenerate `schema.json` and `sanity.types.ts`, update README to explain new features and configuration, and validate both public and studio deployments using Chrome DevTools MCP and agent-browser snapshots.

**Tech Stack:** Next.js 16, Sanity v5, pnpm, Biome, Sanity CLI/typegen, Chrome DevTools MCP, agent-browser, subagent-driven workflow.

---

### Task 1: Scope changes & prepare TODO list
**Files:** `README.md`, `.gitignore`, `.vercel.env.example.json`, `sanity.env.ts`, `sanity.cli.ts`, `sanity-typegen.json`, `schema.json`, `sanity.types.ts`, `sanity/schemaTypes/**`, `docs/**`, `components`, `lib`, `db`

**Steps**
1. Run `git status -sb`, `git diff`, `git diff --stat` to capture the workspace state and identify relevant files.
2. Confirm which files the Sanity dataset/typegen work should touch vs unrelated feature work.
3. Update the existing todo list (use `todowrite`) reflecting scoped tasks.

### Task 2: Configure Sanity CLI for project `mdokvla9` + dataset `develop`
**Files:** `sanity.cli.ts`, `sanity/env.ts`, `.vercel.env.example.json`, README env sections

**Steps**
1. Inspect `sanity.cli.ts`/`sanity/env.ts` to ensure env-based overrides are used for project/dataset.
2. Run `SANITY_STUDIO_PROJECT_ID=mdokvla9 SANITY_STUDIO_DATASET=develop pnpm sanity dataset list` to confirm dataset exists; if missing, run `sanity dataset create develop`.
3. Make sure `.vercel.env.example.json` and README env docs call out the develop dataset and sample env variables.

### Task 3: Regenerate schema + typegen outputs via CLI
**Files:** `schema.json`, `sanity.types.ts`, `sanity-typegen.json`

**Steps**
1. Execute `SANITY_STUDIO_PROJECT_ID=mdokvla9 SANITY_STUDIO_DATASET=develop pnpm typegen`.
2. Review diffs to verify generated files are updated and no unrelated files changed.
3. Run a relevant Sanity lint or sanity command if available to ensure success.

### Task 4: Update README with new feature highlights
**Files:** `README.md`

**Steps**
1. Summarize the refreshed Sanity experience, dataset, and any new admin features in the features or project sections.
2. Include a note that env variables should point to project `mdokvla9` and dataset `develop` for typegen + CLI operations.
3. Keep the tone concise and consistent with existing sections, referencing new docs or screenshot locations if applicable.

### Task 5: Secrets check & `.gitignore` validation
**Files:** `.gitignore`, `.vercel.env.example.json`, `docs/**`, `db/**`

**Steps**
1. Run `rg -n "API_KEY|SECRET|TOKEN|PASS|CLERK|SANITY"` across tracked files to ensure nothing sensitive is being committed.
2. Confirm `.gitignore` covers `.env*`, `.vercel.env.json`, `.sanity/*`, `.clerk/`, generated sanity files, logs, and build artifacts.
3. If new sensitive files appear, either remove them or ignore appropriately.

### Task 6: Stage, commit, push
**Files to stage:** `README.md`, `.vercel.env.example.json`, `schema.json`, `sanity.types.ts`, any touched schema files, `docs/plans/2026-01-26-sanity-dataset-typegen-prod-verification.md` (plan file is new), `sanity-typegen.json` if updated.

**Steps**
1. Run `git add` only on the relevant files.
2. Commit with `feat: align Sanity dataset + typegen with develop + doc updates`.
3. Push branch `feature/chat-usage-limits` to origin.

### Task 7: Production verification via DevTools + agent-browser
**Targets:** `https://shivansh-sharma.vercel.app`, `https://shivansh-sharma.vercel.app/studio`, `https://shivansh-portfolio-gamma.vercel.app`, `https://shivansh-portfolio-gamma.vercel.app/studio`, Sanity Studio at https://www.sanity.io/manage/project/mdokvla9 (use authenticated session)

**Steps**
1. Use Chrome DevTools MCP commands to load each URL, check for errors, and note page status.
2. Use `agent-browser` to snapshot each page, confirm key UI elements load, and capture any console/network issues.
3. Record verification notes for each domain (page load, Studio load, dataset references visible).

### Task 8: Final report & next steps
1. Summarize changes, generated assets, and verification outcomes.
2. Mention any remaining follow-up (e.g., dataset seeded data, manual QA). 
