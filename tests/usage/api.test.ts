import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUsageStatus } from "@/lib/usage/api";

test("normalizeUsageStatus marks limited when sessions exhausted", () => {
  const status = normalizeUsageStatus({
    sessionsRemaining: 0,
    messagesRemaining: 5,
  });

  assert.equal(status.isLimited, true);
});
