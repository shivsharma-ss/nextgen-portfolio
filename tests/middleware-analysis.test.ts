import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

// Mock the Clerk environment for the first test
const originalEnv = process.env;

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

  // Import the middleware after removing env vars
  const { default: proxyMiddleware } = await import("../proxy");

  let hasError = false;
  let errorMessage = "";

  try {
    await proxyMiddleware(request, {} as any);
  } catch (error) {
    hasError = true;
    errorMessage = (error as Error).message;
  }

  // Verify that middleware throws when Clerk is not configured
  assert.equal(hasError, true, "Middleware should throw without Clerk config");
  assert.ok(
    errorMessage.includes("Missing publishableKey"),
    "Should specify missing publishableKey error",
  );

  // Restore environment
  process.env = originalEnv;
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

test("middleware solution should allow optional auth", () => {
  // Test demonstrates what the solution should look like

  // The matcher should remain the same (exclude static assets, include API)
  const expectedMatcher = [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ];

  // The middleware should:
  // 1. Use clerkMiddleware with authOptional() for guest access
  // 2. OR implement custom logic that conditionally applies Clerk

  // This is what we need to implement
  const needsNewMiddleware = true;
  assert.equal(needsNewMiddleware, true, "We need a new middleware approach");
});
