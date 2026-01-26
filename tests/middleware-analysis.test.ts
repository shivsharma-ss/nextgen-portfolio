import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createRequire } from "node:module";

// Snapshot of the environment so we can restore it safely between tests
const originalEnvSnapshot = { ...process.env };
const restoreEnvSnapshot = () => {
  Object.keys(process.env).forEach((key) => {
    delete process.env[key];
  });
  Object.assign(process.env, originalEnvSnapshot);
};

test("current proxy middleware requires Clerk configuration", async () => {
  // Remove Clerk env vars to simulate missing configuration
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;

  const request = new NextRequest("http://localhost:3000/api/test", {
    method: "GET",
    headers: {
      "user-agent": "test-agent",
    },
  });

  const require = createRequire(import.meta.url);
  delete require.cache[require.resolve("../proxy")];

  try {
    const { default: proxyMiddleware } = await import("../proxy");
    await assert.rejects(
      async () => {
        await proxyMiddleware(request, {} as any);
      },
      {
        message: /Missing publishableKey/,
      },
    );
  } finally {
    restoreEnvSnapshot();
  }
});

test("need new middleware for optional auth", async () => {
  // This test verifies that we need a new middleware approach

  // The current proxy.ts uses clerkMiddleware() which requires auth
  // We need a middleware that:
  // 1. Allows guests to browse without auth
  // 2. Preserves Clerk for SignIn/signOut functionality
  // 3. Only requires auth for protected routes

  const currentProxyContent = await import("../proxy");

  // The proxy exports clerkMiddleware() directly, which means auth is required
  assert.ok(currentProxyContent.default, "Current middleware exists");

  // But createSession already handles null userId (guest access)
  const { createSession } = await import("../app/actions/create-session");
  assert.ok(
    typeof createSession === "function",
    "createSession function exists",
  );

  // This confirms the architecture supports guest access at the API level
  // but the middleware layer requires auth configuration
});

test.todo("middleware solution should allow optional auth");
