type VisitorIdentity = {
  subject: string;
};

type UsageStatus = {
  sessionsToday: number;
  messagesToday: number;
  isSessionBlocked: boolean;
  isMessageBlocked: boolean;
  cooldownEndsAt: number | null;
};

type UsageLimits = {
  sessionsPerDay: number;
  messagesPerDay: number;
  sessionMinutes: number;
  cooldownHours: number;
};

type UsageLimitDetails = {
  subject: string;
  status: UsageStatus;
  limits: UsageLimits;
};

type SessionPayloadInput = {
  workflowId: string;
  identity: VisitorIdentity;
};

type UsageStore = {
  getStatus: (input: {
    subject: string;
    sessionsPerDay: number;
    messagesPerDay: number;
  }) => UsageStatus;
  recordSession: (input: {
    subject: string;
    sessionsPerDay: number;
    messagesPerDay: number;
  }) => void;
};

export type ChatKitSessionPayload = {
  workflow: { id: string };
  user: string;
};

type OpenAiErrorLogger = (
  message: string,
  details?: Record<string, unknown>,
) => void;

export class UsageLimitError extends Error {
  readonly code = "USAGE_LIMIT";
  readonly details: UsageLimitDetails;

  constructor(details: UsageLimitDetails) {
    super("Usage limit reached");
    this.name = "UsageLimitError";
    this.details = details;
  }
}

export const mapUsageLimitError = (details: UsageLimitDetails) =>
  new UsageLimitError(details);

export const enforceSessionUsage = ({
  store,
  subject,
  limits,
}: {
  store: UsageStore;
  subject: string;
  limits: UsageLimits;
}) => {
  const status = store.getStatus({
    subject,
    sessionsPerDay: limits.sessionsPerDay,
    messagesPerDay: limits.messagesPerDay,
  });

  if (status.isSessionBlocked) {
    throw mapUsageLimitError({ subject, status, limits });
  }

  store.recordSession({
    subject,
    sessionsPerDay: limits.sessionsPerDay,
    messagesPerDay: limits.messagesPerDay,
  });

  return status;
};

export const buildSessionPayload = ({
  workflowId,
  identity,
}: SessionPayloadInput): ChatKitSessionPayload => {
  return {
    workflow: { id: workflowId },
    user: identity.subject,
  };
};

/**
 * Use x-forwarded-for only when the platform is trusted (e.g. Vercel).
 * Falls back to x-real-ip or an empty string when no trusted IP is present.
 */
export const resolveClientIp = ({
  forwardedFor,
  realIp,
  isVercel,
}: {
  forwardedFor?: string | null;
  realIp?: string | null;
  isVercel: boolean;
}): string => {
  if (!isVercel) {
    return "";
  }

  const forwardedIp = forwardedFor?.split(",")[0]?.trim();
  return forwardedIp || realIp || "";
};

export const ensureOpenAiSessionOk = async ({
  response,
  log,
}: {
  response: {
    ok: boolean;
    status: number;
    statusText?: string;
    text: () => Promise<string>;
  };
  log?: OpenAiErrorLogger;
}) => {
  if (response.ok) {
    return;
  }

  const errorText = await response.text();
  const logger = log ?? ((message, details) => console.error(message, details));

  logger("OpenAI ChatKit session request failed", {
    status: response.status,
    statusText: response.statusText,
    error: errorText,
  });

  throw new Error("Failed to create session");
};

export const assertClientSecret = (data: unknown): string => {
  if (
    !data ||
    typeof data !== "object" ||
    typeof (data as { client_secret?: unknown }).client_secret !== "string"
  ) {
    throw new Error("OpenAI session response missing client_secret");
  }

  return (data as { client_secret: string }).client_secret;
};
