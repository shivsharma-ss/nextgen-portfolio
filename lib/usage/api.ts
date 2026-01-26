type UsageStatusInput = {
  sessionsRemaining: number;
  messagesRemaining: number;
  isSessionBlocked?: boolean;
  isMessageBlocked?: boolean;
  cooldownEndsAt?: number | null;
};

export type UsageStatus = {
  sessionsToday: number;
  messagesToday: number;
  isSessionBlocked: boolean;
  isMessageBlocked: boolean;
  cooldownEndsAt: number | null;
};

type UsageLimits = {
  sessionsPerDay: number;
  messagesPerDay: number;
};

export type UsageStatusResponse = {
  sessionsRemaining: number;
  messagesRemaining: number;
  isLimited: boolean;
  isSessionBlocked: boolean;
  isMessageBlocked: boolean;
  cooldownEndsAt: number | null;
};

export const normalizeUsageStatus = ({
  sessionsRemaining,
  messagesRemaining,
  isSessionBlocked,
  isMessageBlocked,
  cooldownEndsAt = null,
}: UsageStatusInput): UsageStatusResponse => {
  const safeSessions = Math.max(0, sessionsRemaining);
  const safeMessages = Math.max(0, messagesRemaining);
  const sessionBlocked = isSessionBlocked ?? safeSessions <= 0;
  const messageBlocked = isMessageBlocked ?? safeMessages <= 0;

  return {
    sessionsRemaining: safeSessions,
    messagesRemaining: safeMessages,
    isLimited: sessionBlocked || messageBlocked,
    isSessionBlocked: sessionBlocked,
    isMessageBlocked: messageBlocked,
    cooldownEndsAt,
  };
};

export const buildUsageStatusResponse = ({
  status,
  limits,
}: {
  status: UsageStatus;
  limits: UsageLimits;
}): UsageStatusResponse => {
  return normalizeUsageStatus({
    sessionsRemaining: limits.sessionsPerDay - status.sessionsToday,
    messagesRemaining: limits.messagesPerDay - status.messagesToday,
    isSessionBlocked: status.isSessionBlocked,
    isMessageBlocked: status.isMessageBlocked,
    cooldownEndsAt: status.cooldownEndsAt,
  });
};

export const createUnlimitedUsageStatus = (): UsageStatus => ({
  sessionsToday: 0,
  messagesToday: 0,
  isSessionBlocked: false,
  isMessageBlocked: false,
  cooldownEndsAt: null,
});
