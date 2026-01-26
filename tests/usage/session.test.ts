import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { migrateUsageDb } from "@/lib/db/migrate";
import { buildVisitorIdentity } from "@/lib/usage/identity";
import {
  assertClientSecret,
  buildSessionPayload,
  enforceSessionUsage,
  ensureOpenAiSessionOk,
  mapUsageLimitError,
  resolveClientIp,
  UsageLimitError,
} from "@/lib/usage/session";
import { createUsageStore } from "@/lib/usage/store";

const createStore = () => {
  const db = new Database(":memory:");
  migrateUsageDb({ db });
  return { db, store: createUsageStore(db) };
};

test("buildSessionPayload uses guest subject for ChatKit user", () => {
  const identity = buildVisitorIdentity({
    ip: "203.0.113.10",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64)",
    visitorId: "visitor-guest-1",
  });

  const payload = buildSessionPayload({
    workflowId: "workflow-123",
    identity,
  });

  assert.deepEqual(payload, {
    workflow: { id: "workflow-123" },
    user: identity.subject,
  });
});

test("mapUsageLimitError returns typed error with details", () => {
  const error = mapUsageLimitError({
    subject: "visitor-guest-2",
    status: {
      sessionsToday: 3,
      messagesToday: 10,
      isSessionBlocked: true,
      isMessageBlocked: false,
      cooldownEndsAt: 1730000000,
    },
    limits: {
      sessionsPerDay: 3,
      messagesPerDay: 20,
      sessionMinutes: 30,
      cooldownHours: 1,
    },
  });

  assert.ok(error instanceof UsageLimitError);
  assert.equal(error.name, "UsageLimitError");
  assert.equal(error.code, "USAGE_LIMIT");
  assert.equal(error.details.subject, "visitor-guest-2");
  assert.equal(error.details.status.isSessionBlocked, true);
  assert.equal(error.details.limits.sessionsPerDay, 3);
});

test("enforceSessionUsage throws when session limit reached", () => {
  const { db, store } = createStore();

  const limits = {
    sessionsPerDay: 1,
    messagesPerDay: 5,
    sessionMinutes: 30,
    cooldownHours: 1,
  };

  store.recordSession({
    subject: "visitor-guest-3",
    sessionsPerDay: limits.sessionsPerDay,
    messagesPerDay: limits.messagesPerDay,
  });

  assert.throws(
    () =>
      enforceSessionUsage({
        store,
        subject: "visitor-guest-3",
        limits,
      }),
    (error: Error) => error instanceof UsageLimitError,
  );

  db.close();
});

test("resolveClientIp uses forwarded-for only on Vercel", () => {
  const ip = resolveClientIp({
    forwardedFor: "203.0.113.10, 70.0.0.1",
    realIp: "198.51.100.5",
    isVercel: true,
  });

  assert.equal(ip, "203.0.113.10");
});

test("resolveClientIp returns empty off Vercel", () => {
  const ip = resolveClientIp({
    forwardedFor: "203.0.113.10",
    realIp: "198.51.100.5",
    isVercel: false,
  });

  assert.equal(ip, "");
});

test("resolveClientIp returns empty when no trusted ip", () => {
  const ip = resolveClientIp({
    forwardedFor: "",
    realIp: "",
    isVercel: true,
  });

  assert.equal(ip, "");
});

test("ensureOpenAiSessionOk logs and throws generic error", async () => {
  const logs: Array<{ message: string; details?: Record<string, unknown> }> =
    [];
  const response = {
    ok: false,
    status: 500,
    statusText: "Internal Server Error",
    text: async () => "backend failure",
  };

  await assert.rejects(
    async () =>
      ensureOpenAiSessionOk({
        response,
        log: (message: string, details?: Record<string, unknown>) =>
          logs.push({ message, details }),
      }),
    (error: Error) => error.message === "Failed to create session",
  );

  assert.equal(logs.length, 1);
  assert.equal(logs[0]?.message, "OpenAI ChatKit session request failed");
  assert.equal(logs[0]?.details?.error, "backend failure");
  assert.equal(logs[0]?.details?.status, 500);
});

test("assertClientSecret returns client_secret string", () => {
  const secret = assertClientSecret({ client_secret: "secret-123" });

  assert.equal(secret, "secret-123");
});

test("assertClientSecret throws when missing client_secret", () => {
  assert.throws(
    () => assertClientSecret({}),
    (error: Error) =>
      error.message === "OpenAI session response missing client_secret",
  );
});

test("assertClientSecret throws when client_secret is not string", () => {
  assert.throws(
    () => assertClientSecret({ client_secret: 123 }),
    (error: Error) =>
      error.message === "OpenAI session response missing client_secret",
  );
});
