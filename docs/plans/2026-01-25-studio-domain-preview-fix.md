# Studio Domain Alignment & Presentation Preview Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align both Vercel domains to the same Studio build and ensure Sanity Presentation preview targets a deployed domain instead of localhost.

**Architecture:** Keep a single Sanity project/dataset (mdokvla9/develop) and a single Vercel project; update aliases so both domains point to the latest production deployment. Configure the Presentation tool to use a deployed preview origin and persist it via environment or user setting.

**Tech Stack:** Next.js (App Router), Sanity Studio + presentationTool, Vercel, Sanity CLI/MCP

---

### Task 1: Confirm current deployment/preview state (baseline)

**Files:**
- No code changes.

**Step 1: Reproduce missing Skill Categories on shivansh-sharma**

- Open `https://shivansh-sharma.vercel.app/studio/structure/portfolio;skills`.
- Expected: Skills list without “Skill Categories”.

**Step 2: Confirm Skill Categories exists on gamma**

- Open `https://shivansh-portfolio-gamma.vercel.app/studio/structure/portfolio;skills;skill-categories-menu`.
- Expected: “Skill Categories” menu and docs list visible.

**Step 3: Identify deployments each domain points to**

- Run: `vercel inspect shivansh-portfolio-gamma.vercel.app --json`
- Run: `vercel inspect shivansh-sharma.vercel.app --json`
- Expected: Two different `id`/`createdAt` values (older for shivansh-sharma).

### Task 2: Align `shivansh-sharma.vercel.app` to latest deployment

**Files:**
- No code changes.

**Step 1: Capture latest production deployment URL**

- Use output from Task 1 for `shivansh-portfolio-gamma.vercel.app`.
- Expected: `url` like `shivansh-portfolio-<hash>.vercel.app`.

**Step 2: Update alias**

- Run: `vercel alias set <deployment-url> shivansh-sharma.vercel.app`
- Expected: Alias assignment success.

**Step 3: Verify alias**

- Run: `vercel inspect shivansh-sharma.vercel.app`
- Expected: Matches same `id`/`createdAt` as gamma.

### Task 3: Verify Skill Categories now appears on both domains

**Files:**
- No code changes.

**Step 1: Refresh both studios**

- Open both studio URLs again.
- Expected: “Skill Categories” visible in both.

### Task 4: Fix Presentation preview URL in Sanity-hosted Studio

**Files:**
- Modify only if needed: `sanity.config.ts`

**Step 1: Reproduce preview failure**

- Open `https://www.sanity.io/@oIo2DqA1Y/studio/z8phgqxropk95ceoposbxcec/default/presentation`.
- Expected: Preview URL field shows `http://localhost:3000/api/draft-mode/enable` and error.

**Step 2: Set preview URL to deployed domain in UI**

- Replace with `https://shivansh-sharma.vercel.app/api/draft-mode/enable`.
- Click refresh/open preview.
- Expected: Preview loads and draft mode enables.

**Step 3: If UI value resets back to localhost**

- Set `SANITY_STUDIO_PREVIEW_ORIGIN=https://shivansh-sharma.vercel.app` in the environment used for `sanity deploy`.
- Redeploy: `SANITY_STUDIO_PREVIEW_ORIGIN=https://shivansh-sharma.vercel.app sanity deploy`
- Expected: Presentation default uses deployed domain on next load.

**Step 4: If still falling back to localhost**

- Update `sanity.config.ts` to prioritize `SANITY_STUDIO_PREVIEW_ORIGIN` for `sanity.io`/`sanity.studio` origins, then redeploy.

### Task 5: Final verification

**Files:**
- No code changes.

**Step 1: Smoke check**

- Both Vercel domains show Skill Categories.
- Sanity Presentation preview loads deployed site (no localhost).
