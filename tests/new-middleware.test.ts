import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";
import { createRequire } from "node:module";

test("new proxy middleware allows guest access to chat API", async () => {
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  delete process.env.CLERK_SECRET_KEY;

  const require = createRequire(import.meta.url);
  const chatRequest = new NextRequest("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "user-agent": "test-agent",
      "content-type": "application/json",
    },
    body: JSON.stringify({ message: "Hello from guest" }),
  });

  try {
    delete require.cache[require.resolve("../proxy")];
    const { default: newProxyMiddleware } = await import("../proxy");

    await assert.doesNotReject(
      async () => {
        await newProxyMiddleware(chatRequest, {} as any);
      },
      "New middleware should allow guest access to /api/chat",
    );
  } finally {
    if (originalPublishableKey === undefined) {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    }
    if (originalSecretKey === undefined) {
      delete process.env.CLERK_SECRET_KEY;
    } else {
      process.env.CLERK_SECRET_KEY = originalSecretKey;
    }
    delete require.cache[require.resolve("../proxy")];
  }
});

test("new proxy middleware allows guest access to homepage", async () => {
  // Test that guests can access the homepage

  const { default: newProxyMiddleware } = await import("../proxy");

  const homeRequest = new NextRequest("http://localhost:3000/", {
    method: "GET",
    headers: {
      "user-agent": "test-agent",
    },
  });

  let hasError = false;

  try {
    await newProxyMiddleware(homeRequest, {} as any);
  } catch (error) {
    hasError = true;
  }

  // Homepage should be accessible to guests
  assert.equal(
    hasError,
    false,
    "New middleware should allow guest access to homepage",
  );
});

test("new middleware preserves Clerk for protected routes when configured", async () => {
  const require = createRequire(import.meta.url);
  const originalPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const originalSecretKey = process.env.CLERK_SECRET_KEY;

  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock_key";
  process.env.CLERK_SECRET_KEY = "sk_test_mock_key";

  const protectedRequest = new NextRequest("http://localhost:3000/dashboard", {
    method: "GET",
    headers: {
      "user-agent": "test-agent",
    },
  });

  try {
    delete require.cache[require.resolve("../proxy")];
    const { default: newProxyMiddleware } = await import("../proxy");

    await assert.doesNotReject(async () => {
      await newProxyMiddleware(protectedRequest, {} as any);
    });
  } finally {
    if (originalPublishableKey === undefined) {
      delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    } else {
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = originalPublishableKey;
    }
    if (originalSecretKey === undefined) {
      delete process.env.CLERK_SECRET_KEY;
    } else {
      process.env.CLERK_SECRET_KEY = originalSecretKey;
    }
    delete require.cache[require.resolve("../proxy")];
  }
});

test("createSession works with new middleware approach", async () => {
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
    const { createSession } = await import("../app/actions/create-session");
    assert.ok(
      typeof createSession === "function",
      "createSession should be available",
    );
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
