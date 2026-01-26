# Simplify Sidebar Toggle Effect Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the usage status effect by using a local AbortController and removing the unused ref.

**Architecture:** Keep the effect self-contained with a single AbortController instance scoped to the effect. Minimize error handling to only ignore aborts without extra logging.

**Tech Stack:** React (Next.js), TypeScript

---

### Task 1: Update SidebarToggle effect

**Files:**
- Modify: `components/SidebarToggle.tsx`

**Step 1: Confirm current effect behavior**

Read the existing effect to ensure the AbortController and ref are only used for request cancellation.

**Step 2: Simplify controller usage**

Remove `usageAbortRef` and use a single local controller inside the effect.

```tsx
useEffect(() => {
  const controller = new AbortController();

  void (async () => {
    try {
      const payload = await fetchUsageStatus(fetch, "/api/chat/usage", {
        signal: controller.signal,
      });
      if (!payload || controller.signal.aborted) {
        return;
      }
      setUsage(payload);
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }
    }
  })();

  return () => {
    controller.abort();
  };
}, []);
```

**Step 3: Skip tests**

No tests required per request.

**Step 4: Manual verification (optional)**

If desired, run the app and ensure the button renders and no console errors appear.

Run: `pnpm dev`
Expected: App starts with no errors.
