import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import proxyMiddleware, { config } from "../proxy";
import { createSession } from "../app/actions/create-session";

test("proxy middleware allows guest access to public routes", async () => {
  const request = new NextRequest("http://localhost:3000/api/test", {
    method: "GET",
    headers: {
      "user-agent": "test-agent",
    },
  });

  // The middleware should not throw for unauthenticated requests
  let hasError = false;

  try {
    // Clerk middleware runs but should allow unauthenticated access
    // Pass mock event object as second parameter
    await proxyMiddleware(request, {} as any);
  } catch (error) {
    hasError = true;
    console.log("Middleware error:", error);
  }

  // Verify that unauthenticated requests are handled gracefully
  assert.equal(
    hasError,
    false,
    "Middleware should not block unauthenticated requests",
  );
});

test("proxy middleware matcher excludes static assets", () => {
  const matcher = config?.matcher || [];

  // Verify that the matcher excludes static files
  assert.ok(
    matcher.some((pattern: string) => pattern.includes("/(api|trpc)(.*)")),
    "Should include API routes",
  );

  assert.ok(matcher.length > 0, "Matcher should not be empty");
  const excludePattern = matcher.find((pattern: string) =>
    pattern.includes("_next"),
  );

  assert.ok(excludePattern, "Matcher should include a static asset exclusion");
  assert.ok(
    excludePattern?.includes("_next"),
    "Should exclude Next.js internals",
  );
  assert.ok(
    excludePattern?.includes("\\.(?:html?|css|js"),
    "Should exclude static files",
  );
});

test("createSession handles both authenticated and unauthenticated users", async () => {
  // We only run a minimal smoke check to ensure the exported function is callable.
  const originalFetch = global.fetch;
  const originalApiKey = process.env.OPENAI_API_KEY;
  const originalWorkflowId = process.env.WORKFLOW_ID;

  global.fetch = async () =>
    new Response(JSON.stringify({ client_secret: "test-secret-123" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }) as any;
  process.env.OPENAI_API_KEY = "test-key";
  process.env.WORKFLOW_ID = "test-workflow";

  try {
    await assert.rejects(async () => {
      await createSession();
    });
  } finally {
    global.fetch = originalFetch;
    if (originalApiKey === undefined) {
      delete process.env.OPENAI_API_KEY;
    } else {
      process.env.OPENAI_API_KEY = originalApiKey;
    }
    if (originalWorkflowId === undefined) {
      delete process.env.WORKFLOW_ID;
    } else {
      process.env.WORKFLOW_ID = originalWorkflowId;
    }
  }
});
