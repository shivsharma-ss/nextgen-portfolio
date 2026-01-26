import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { existsSync } from "node:fs";

/**
 * API Validation Tests for Usage Limits
 *
 * These tests validate that the usage limit APIs are properly configured
 * and will work correctly during manual testing.
 */

test("API Configuration Validation", () => {
  // Verify that usage limit configuration matches expected values
  const { FREE_LIMITS, AUTH_LIMITS } = require("@/lib/usage/config");

  // Test free limits
  assert.deepEqual(
    FREE_LIMITS,
    {
      sessionsPerDay: 3,
      messagesPerDay: 20,
      sessionMinutes: 30,
      cooldownHours: 1,
    },
    "Free limits should match expected configuration",
  );

  // Test authenticated limits
  assert.deepEqual(
    AUTH_LIMITS,
    {
      sessionsPerDay: 10,
      messagesPerDay: 50,
      sessionMinutes: 30,
      cooldownHours: 1,
    },
    "Authenticated limits should match expected configuration",
  );

  // Test limit selection logic
  const { selectUsageLimits } = require("@/lib/usage/limits");

  // Guest user should get free limits
  const guestLimits = selectUsageLimits({ isSignedIn: false });
  assert.deepEqual(guestLimits, FREE_LIMITS, "Guest should get free limits");

  // Authenticated user should get higher limits
  const authLimits = selectUsageLimits({ isSignedIn: true });
  assert.deepEqual(
    authLimits,
    AUTH_LIMITS,
    "Authenticated user should get higher limits",
  );

  // Custom configuration should override defaults
  const customConfig = {
    freeLimits: {
      sessionsPerDay: 7,
      messagesPerDay: 25,
      sessionMinutes: 15,
      cooldownHours: 2,
    },
    authLimits: {
      sessionsPerDay: 15,
      messagesPerDay: 80,
      sessionMinutes: 45,
      cooldownHours: 1,
    },
  };
  const customLimits = selectUsageLimits({
    isSignedIn: true,
    config: customConfig,
  });
  assert.deepEqual(
    customLimits,
    customConfig.authLimits,
    "Authenticated user should respect custom config",
  );

  // Verify expected API endpoints exist (by checking their route patterns)
  const expectedApiRoutes = [
    "/api/chat/create-session",
    "/api/chat/send-message",
    "/api/chat/usage",
  ];

  expectedApiRoutes.forEach((route) => {
    assert.ok(route.startsWith("/api/"), `${route} should be an API route`);
    const routeSegments = route.replace(/^\/api\//, "").split("/");
    const routeFilePath = path.join(
      process.cwd(),
      "app",
      "api",
      ...routeSegments,
      "route.ts",
    );
    assert.ok(
      existsSync(routeFilePath),
      `Expected route file exists for ${route}`,
    );
  });

  console.log("✅ API configuration validation completed successfully");
});

test("Manual Testing Data Matches Config", () => {
  // Test data points that should be verified during manual testing

  const freeUserTestData = {
    expectedSessions: 3,
    expectedMessages: 20,
    blockedAfterSessions: 4,
    testMessages: [
      "Hello, this is my first message",
      "Hello, this is my second message",
      "Hello, this is my third message",
    ],
  };

  const authUserTestData = {
    expectedSessions: 10,
    expectedMessages: 50,
    blockedAfterSessions: 11,
    testMessages: [
      "Session 4 as authenticated user",
      "Session 5 as authenticated user",
      "Session 6 as authenticated user",
      "Session 7 as authenticated user",
    ],
  };

  const { FREE_LIMITS, AUTH_LIMITS } = require("@/lib/usage/config");

  assert.equal(
    freeUserTestData.expectedSessions,
    FREE_LIMITS.sessionsPerDay,
    "Free user should expect the configured number of sessions",
  );
  assert.equal(
    freeUserTestData.expectedMessages,
    FREE_LIMITS.messagesPerDay,
    "Free user should expect the configured number of messages",
  );
  assert.equal(
    freeUserTestData.blockedAfterSessions,
    FREE_LIMITS.sessionsPerDay + 1,
    "Free user should be blocked on the session after the limit",
  );
  assert.equal(
    freeUserTestData.testMessages.length,
    3,
    "Should have 3 test messages for free user",
  );

  assert.equal(
    authUserTestData.expectedSessions,
    AUTH_LIMITS.sessionsPerDay,
    "Auth user should expect the configured number of sessions",
  );
  assert.equal(
    authUserTestData.expectedMessages,
    AUTH_LIMITS.messagesPerDay,
    "Auth user should expect the configured number of messages",
  );
  assert.equal(
    authUserTestData.blockedAfterSessions,
    AUTH_LIMITS.sessionsPerDay + 1,
    "Auth user should be blocked one session after the limit",
  );
  assert.equal(
    authUserTestData.testMessages.length,
    4,
    "Should have 4 test messages for auth user",
  );

  console.log("✅ Manual testing data validation completed successfully");
});
