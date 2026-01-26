import assert from "node:assert/strict";
import test from "node:test";
import {
  buildUsageBannerState,
  fetchUsageStatus,
  isMessageSendLog,
  isUsageLimitError,
} from "@/lib/usage/client";
import { UsageLimitError } from "@/lib/usage/session";

test("isUsageLimitError accepts UsageLimitError instances", () => {
  const error = new UsageLimitError({
    subject: "visitor-guest-1",
    status: {
      sessionsToday: 2,
      messagesToday: 8,
      isSessionBlocked: true,
      isMessageBlocked: false,
      cooldownEndsAt: null,
    },
    limits: {
      sessionsPerDay: 2,
      messagesPerDay: 10,
      sessionMinutes: 30,
      cooldownHours: 1,
    },
  });

  assert.equal(isUsageLimitError(error), true);
});

test("isUsageLimitError detects serialized UsageLimitError", () => {
  const error = { name: "UsageLimitError", code: "USAGE_LIMIT" };

  assert.equal(isUsageLimitError(error), true);
  assert.equal(isUsageLimitError(new Error("nope")), false);
});

test("isMessageSendLog matches message.send events", () => {
  assert.equal(isMessageSendLog({ name: "message.send" }), true);
  assert.equal(isMessageSendLog({ name: "message.receive" }), false);
  assert.equal(isMessageSendLog(null), false);
});

test("buildUsageBannerState prioritizes limit error", () => {
  const state = buildUsageBannerState({
    usage: {
      sessionsRemaining: 0,
      messagesRemaining: 0,
      isLimited: true,
      isSessionBlocked: true,
      isMessageBlocked: true,
      cooldownEndsAt: null,
    },
    limitReached: true,
  });

  assert.equal(state?.tone, "limit");
  assert.match(state?.message ?? "", /sign in/i);
});

test("buildUsageBannerState shows remaining messages", () => {
  const state = buildUsageBannerState({
    usage: {
      sessionsRemaining: 1,
      messagesRemaining: 5,
      isLimited: false,
      isSessionBlocked: false,
      isMessageBlocked: false,
      cooldownEndsAt: null,
    },
    limitReached: false,
  });

  assert.equal(state?.tone, "info");
  assert.match(state?.message ?? "", /5/);
});

test("buildUsageBannerState includes sign-in CTA when usage is limited", () => {
  const state = buildUsageBannerState({
    usage: {
      sessionsRemaining: 0,
      messagesRemaining: 0,
      isLimited: true,
      isSessionBlocked: false,
      isMessageBlocked: true,
      cooldownEndsAt: null,
    },
    limitReached: false,
  });

  assert.equal(state?.tone, "limit");
  assert.equal(state?.showCta, true);
});

test("fetchUsageStatus ignores payloads after abort", async () => {
  const controller = new AbortController();
  const payload = {
    sessionsRemaining: 1,
    messagesRemaining: 2,
    isLimited: false,
    isSessionBlocked: false,
    isMessageBlocked: false,
    cooldownEndsAt: null,
  };
  const fetcher = async () =>
    ({
      ok: true,
      json: async () => {
        controller.abort();
        return payload;
      },
    }) as Response;

  const result = await fetchUsageStatus(fetcher, "/api/chat/usage", {
    signal: controller.signal,
  });

  assert.equal(result, null);
});
