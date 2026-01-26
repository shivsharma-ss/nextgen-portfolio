import type { UsageStatusResponse } from "@/lib/usage/api";
import { UsageLimitError } from "@/lib/usage/session";

type UsageLimitErrorShape = {
  name?: unknown;
  code?: unknown;
};

type ChatLogEvent = {
  name?: string | null;
} | null;

export const isUsageLimitError = (error: unknown): error is UsageLimitError => {
  if (error instanceof UsageLimitError) {
    return true;
  }

  if (!error || typeof error !== "object") {
    return false;
  }

  const details = error as UsageLimitErrorShape;
  return details.name === "UsageLimitError" || details.code === "USAGE_LIMIT";
};

export const isMessageSendLog = (event: ChatLogEvent): boolean => {
  return event?.name === "message.send";
};

type UsageBannerState = {
  tone: "limit" | "info";
  message: string;
  showCta: boolean;
};

type ProfileImageUsageState = {
  isUsageLimited: boolean;
  shouldGateWithSignIn: boolean;
  tooltipText: string;
};

const logUsageFetchWarning = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }

  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
};

export const fetchUsageStatus = async (
  fetcher: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<UsageStatusResponse | null> => {
  if (init?.signal?.aborted) {
    return null;
  }

  try {
    const response = await fetcher(input, init);
    if (!response.ok) {
      logUsageFetchWarning(
        `Failed to fetch usage status: ${response.status} ${response.statusText}`,
      );
      return null;
    }
    let payload: UsageStatusResponse;
    try {
      payload = (await response.json()) as UsageStatusResponse;
    } catch (error) {
      logUsageFetchWarning("Failed to parse usage status response", error);
      return null;
    }
    if (init?.signal?.aborted) {
      return null;
    }
    return payload;
  } catch (error) {
    logUsageFetchWarning("Failed to fetch usage status", error);
    return null;
  }
};

export const buildUsageBannerState = ({
  usage,
  limitReached,
}: {
  usage: UsageStatusResponse | null;
  limitReached: boolean;
}): UsageBannerState | null => {
  const showCta = limitReached || Boolean(usage?.isLimited);

  if (limitReached) {
    return {
      tone: "limit",
      message: "Daily limit reached. Sign in to continue.",
      showCta,
    };
  }

  if (!usage) {
    return null;
  }

  if (usage.isLimited) {
    return {
      tone: "limit",
      message: "Usage limit reached for today.",
      showCta,
    };
  }

  return {
    tone: "info",
    message: `Messages left today: ${usage.messagesRemaining}`,
    showCta,
  };
};

export const getProfileImageUsageState = ({
  isSignedIn,
  usage,
}: {
  isSignedIn: boolean;
  usage: UsageStatusResponse | null;
}): ProfileImageUsageState => {
  const isUsageLimited = Boolean(usage?.isLimited);
  const shouldGateWithSignIn = !isSignedIn && isUsageLimited;

  return {
    isUsageLimited,
    shouldGateWithSignIn,
    tooltipText: shouldGateWithSignIn
      ? "Daily limit reached - sign in to continue"
      : isUsageLimited
        ? "Daily limit reached"
        : "Chat with AI Twin",
  };
};
