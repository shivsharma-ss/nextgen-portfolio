import assert from "node:assert/strict";
import test from "node:test";
import type { UsageStatusResponse } from "@/lib/usage/api";
import * as usageClient from "@/lib/usage/client";

const baseUsage: UsageStatusResponse = {
  sessionsRemaining: 1,
  messagesRemaining: 1,
  isLimited: false,
  isSessionBlocked: false,
  isMessageBlocked: false,
  cooldownEndsAt: null,
};

test("getProfileImageUsageState allows guests when not limited", () => {
  assert.equal(typeof usageClient.getProfileImageUsageState, "function");

  const state = usageClient.getProfileImageUsageState({
    isSignedIn: false,
    usage: baseUsage,
  });

  assert.equal(state.shouldGateWithSignIn, false);
  assert.equal(state.isUsageLimited, false);
  assert.equal(state.tooltipText, "Chat with AI Twin");
});

test("getProfileImageUsageState gates guests when limited", () => {
  assert.equal(typeof usageClient.getProfileImageUsageState, "function");

  const state = usageClient.getProfileImageUsageState({
    isSignedIn: false,
    usage: { ...baseUsage, isLimited: true },
  });

  assert.equal(state.shouldGateWithSignIn, true);
  assert.equal(state.isUsageLimited, true);
  assert.match(state.tooltipText, /limit/i);
});

test("getProfileImageUsageState shows limits for signed-in users", () => {
  assert.equal(typeof usageClient.getProfileImageUsageState, "function");

  const limitedState = usageClient.getProfileImageUsageState({
    isSignedIn: true,
    usage: { ...baseUsage, isLimited: true },
  });

  assert.equal(limitedState.shouldGateWithSignIn, false);
  assert.equal(limitedState.isUsageLimited, true);
  assert.match(limitedState.tooltipText, /limit/i);

  const unlimitedState = usageClient.getProfileImageUsageState({
    isSignedIn: true,
    usage: baseUsage,
  });

  assert.equal(unlimitedState.shouldGateWithSignIn, false);
  assert.equal(unlimitedState.isUsageLimited, false);
  assert.equal(unlimitedState.tooltipText, "Chat with AI Twin");
});
