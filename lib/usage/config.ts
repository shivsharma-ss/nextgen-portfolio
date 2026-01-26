export type UsageLimits = {
  sessionsPerDay: number;
  messagesPerDay: number;
  sessionMinutes: number;
  cooldownHours: number;
};

export const FREE_LIMITS: UsageLimits = {
  sessionsPerDay: 3,
  messagesPerDay: 20,
  sessionMinutes: 30,
  cooldownHours: 1,
};

export const AUTH_LIMITS: UsageLimits = {
  sessionsPerDay: 10,
  messagesPerDay: 50,
  sessionMinutes: 30,
  cooldownHours: 1,
};

export type UsageLimitsDoc = Partial<{
  freeSessionsPerDay: number;
  freeMessagesPerDay: number;
  authSessionsPerDay: number;
  authMessagesPerDay: number;
  sessionMinutes: number;
  cooldownHours: number;
}>;

export type UsageLimitsConfig = {
  freeLimits: UsageLimits;
  authLimits: UsageLimits;
};

export const DEFAULT_USAGE_LIMITS: UsageLimitsConfig = {
  freeLimits: FREE_LIMITS,
  authLimits: AUTH_LIMITS,
};

const ensurePositiveNumber = (value: unknown, fallback: number) => {
  const candidate = Number(value);
  return Number.isFinite(candidate) && candidate >= 1 ? candidate : fallback;
};

export function normalizeUsageLimits(doc?: UsageLimitsDoc): UsageLimitsConfig {
  if (!doc) {
    return DEFAULT_USAGE_LIMITS;
  }

  const sessionMinutesFallback = FREE_LIMITS.sessionMinutes;
  const cooldownFallback = FREE_LIMITS.cooldownHours;

  const freeLimits: UsageLimits = {
    sessionsPerDay: ensurePositiveNumber(
      doc.freeSessionsPerDay,
      FREE_LIMITS.sessionsPerDay,
    ),
    messagesPerDay: ensurePositiveNumber(
      doc.freeMessagesPerDay,
      FREE_LIMITS.messagesPerDay,
    ),
    sessionMinutes: ensurePositiveNumber(
      doc.sessionMinutes,
      sessionMinutesFallback,
    ),
    cooldownHours: ensurePositiveNumber(doc.cooldownHours, cooldownFallback),
  };

  const authLimits: UsageLimits = {
    sessionsPerDay: ensurePositiveNumber(
      doc.authSessionsPerDay,
      AUTH_LIMITS.sessionsPerDay,
    ),
    messagesPerDay: ensurePositiveNumber(
      doc.authMessagesPerDay,
      AUTH_LIMITS.messagesPerDay,
    ),
    sessionMinutes: ensurePositiveNumber(
      doc.sessionMinutes,
      AUTH_LIMITS.sessionMinutes,
    ),
    cooldownHours: ensurePositiveNumber(
      doc.cooldownHours,
      AUTH_LIMITS.cooldownHours,
    ),
  };

  return {
    freeLimits,
    authLimits,
  };
}
