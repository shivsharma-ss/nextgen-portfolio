import { randomUUID } from "node:crypto";
import type { Database as SqliteDatabase } from "better-sqlite3";

type StatusInput = {
  subject: string;
  sessionsPerDay: number;
  messagesPerDay: number;
};

type SessionInput = {
  subject: string;
  sessionsPerDay: number;
  messagesPerDay: number;
};

type MessageInput = {
  subject: string;
  messagesPerDay: number;
};

type UsageStatus = {
  sessionsToday: number;
  messagesToday: number;
  isSessionBlocked: boolean;
  isMessageBlocked: boolean;
  cooldownEndsAt: number | null;
};

const getStartOfDay = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  return Math.floor(start.getTime() / 1000);
};

const getStartOfNextDay = (now = new Date()) => {
  const start = new Date(now);
  start.setHours(24, 0, 0, 0);
  return Math.floor(start.getTime() / 1000);
};

const getNowSeconds = () => Math.floor(Date.now() / 1000);

export const createUsageStore = (db: SqliteDatabase) => {
  const ensureVisitor = db.prepare(
    `
      insert into usage_visitors (id, created_at, last_seen_at)
      values (?, ?, ?)
      on conflict(id) do update set last_seen_at = excluded.last_seen_at
    `,
  );
  const insertUsage = db.prepare(
    `
      insert into usage_sessions (id, visitor_id, kind, started_at)
      values (?, ?, ?, ?)
    `,
  );
  const countUsage = db.prepare(
    `
      select count(*) as count
      from usage_sessions
      where visitor_id = ? and kind = ? and started_at >= ?
    `,
  );

  const getCounts = (subject: string) => {
    const startOfDay = getStartOfDay();
    const sessionsToday = countUsage.get(subject, "session", startOfDay) as {
      count: number;
    };
    const messagesToday = countUsage.get(subject, "message", startOfDay) as {
      count: number;
    };

    return {
      sessionsToday: sessionsToday.count,
      messagesToday: messagesToday.count,
    };
  };

  const getStatus = ({
    subject,
    sessionsPerDay,
    messagesPerDay,
  }: StatusInput): UsageStatus => {
    const { sessionsToday, messagesToday } = getCounts(subject);
    const isSessionBlocked = sessionsToday >= sessionsPerDay;
    const isMessageBlocked = messagesToday >= messagesPerDay;
    const cooldownEndsAt = isSessionBlocked ? getStartOfNextDay() : null;

    return {
      sessionsToday,
      messagesToday,
      isSessionBlocked,
      isMessageBlocked,
      cooldownEndsAt,
    };
  };

  const recordSession = db.transaction((input: SessionInput) => {
    const now = getNowSeconds();
    ensureVisitor.run(input.subject, now, now);
    const status = getStatus({
      subject: input.subject,
      sessionsPerDay: input.sessionsPerDay,
      messagesPerDay: input.messagesPerDay,
    });
    if (status.isSessionBlocked) {
      return;
    }

    insertUsage.run(randomUUID(), input.subject, "session", now);
  });

  const recordMessage = db.transaction((input: MessageInput) => {
    const now = getNowSeconds();
    ensureVisitor.run(input.subject, now, now);
    const status = getStatus({
      subject: input.subject,
      sessionsPerDay: Number.MAX_SAFE_INTEGER,
      messagesPerDay: input.messagesPerDay,
    });
    if (status.isMessageBlocked) {
      return;
    }

    insertUsage.run(randomUUID(), input.subject, "message", now);
  });

  return {
    getStatus,
    recordSession,
    recordMessage,
  };
};
