import assert from "node:assert";
import test from "node:test";
import { DEFAULT_USAGE_LIMITS, normalizeUsageLimits } from "@/lib/usage/config";

test("normalizeUsageLimits returns defaults when doc is missing", () => {
  const config = normalizeUsageLimits(undefined);
  assert.deepEqual(config, DEFAULT_USAGE_LIMITS);
});

test("normalizeUsageLimits respects partial overrides", () => {
  const config = normalizeUsageLimits({
    freeSessionsPerDay: 5,
    authMessagesPerDay: 60,
    sessionMinutes: 45,
  });

  assert.equal(config.freeLimits.sessionsPerDay, 5);
  assert.equal(
    config.freeLimits.messagesPerDay,
    DEFAULT_USAGE_LIMITS.freeLimits.messagesPerDay,
  );
  assert.equal(config.authLimits.messagesPerDay, 60);
  assert.equal(config.freeLimits.sessionMinutes, 45);
});
