import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { migrateUsageDb } from "@/lib/db/migrate";
import { createUsageStore } from "@/lib/usage/store";

const createStore = () => {
  const db = new Database(":memory:");
  migrateUsageDb({ db });
  return { db, store: createUsageStore(db) };
};

const getStartOfNextDay = () => {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);
  return Math.floor(nextMidnight.getTime() / 1000);
};

test("getStatus returns zeroed counts for new subjects", () => {
  const { db, store } = createStore();

  const status = store.getStatus({
    subject: "visitor-1",
    sessionsPerDay: 2,
    messagesPerDay: 5,
  });

  assert.deepEqual(status, {
    sessionsToday: 0,
    messagesToday: 0,
    isSessionBlocked: false,
    isMessageBlocked: false,
    cooldownEndsAt: null,
  });

  db.close();
});

test("recordMessage blocks after daily limit reached", () => {
  const { db, store } = createStore();

  const input = {
    subject: "visitor-2",
    messagesPerDay: 2,
  };

  store.recordMessage(input);
  store.recordMessage(input);
  store.recordMessage(input);

  const status = store.getStatus({
    subject: input.subject,
    sessionsPerDay: 2,
    messagesPerDay: input.messagesPerDay,
  });

  assert.equal(status.messagesToday, 2);
  assert.equal(status.isMessageBlocked, true);

  db.close();
});

test("recordSession enforces cooldown after daily limit reached", () => {
  const { db, store } = createStore();

  const input = {
    subject: "visitor-3",
    sessionsPerDay: 2,
    messagesPerDay: 5,
  };

  store.recordSession(input);
  store.recordSession(input);
  store.recordSession(input);

  const status = store.getStatus({
    subject: input.subject,
    sessionsPerDay: input.sessionsPerDay,
    messagesPerDay: input.messagesPerDay,
  });

  assert.equal(status.sessionsToday, 2);
  assert.equal(status.isSessionBlocked, true);
  assert.equal(status.cooldownEndsAt, getStartOfNextDay());

  db.close();
});

test("usage records store kind without relying on id prefixes", () => {
  const { db, store } = createStore();

  const sessionInput = {
    subject: "visitor-4",
    sessionsPerDay: 5,
    messagesPerDay: 5,
  };
  const messageInput = {
    subject: "visitor-4",
    messagesPerDay: 5,
  };

  store.recordSession(sessionInput);
  store.recordMessage(messageInput);

  const rows = db
    .prepare(
      "select id, kind from usage_sessions where visitor_id = ? order by started_at",
    )
    .all(sessionInput.subject) as Array<{ id: string; kind: string }>;

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.kind, "session");
  assert.equal(rows[1]?.kind, "message");
  assert.equal(rows[0]?.id.startsWith("session:"), false);
  assert.equal(rows[1]?.id.startsWith("message:"), false);

  db.close();
});
