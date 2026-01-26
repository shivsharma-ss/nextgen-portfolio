import assert from "node:assert/strict";
import test from "node:test";
import { AUTH_LIMITS, FREE_LIMITS } from "@/lib/usage/config";
import { selectUsageLimits } from "@/lib/usage/limits";

test("selectUsageLimits returns free limits for guests", () => {
  const result = selectUsageLimits({ isSignedIn: false });
  assert.deepEqual(result, FREE_LIMITS);
});

test("selectUsageLimits returns auth limits for signed-in users", () => {
  const result = selectUsageLimits({ isSignedIn: true });
  assert.deepEqual(result, AUTH_LIMITS);
});
