"use client";

import { ChatKit, useChatKit } from "@openai/chatkit-react";
import { useEffect, useRef, useState } from "react";
import { createSession } from "@/app/actions/create-session";
import type { UsageStatusResponse } from "@/lib/usage/api";
import { buildUsageStatusResponse } from "@/lib/usage/api";
import {
  buildUsageBannerState,
  fetchUsageStatus,
  isMessageSendLog,
  isUsageLimitError,
} from "@/lib/usage/client";
import { UsageLimitError } from "@/lib/usage/session";
import type { CHAT_PROFILE_QUERY_RESULT } from "@/sanity.types";
import { useSidebar } from "../ui/sidebar";

export function Chat({
  profile,
}: {
  profile: CHAT_PROFILE_QUERY_RESULT | null;
}) {
  const { toggleSidebar } = useSidebar();
  const [usage, setUsage] = useState<UsageStatusResponse | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const isMountedRef = useRef(true);
  const usageAbortRef = useRef<AbortController | null>(null);
  const logAbortRef = useRef<AbortController | null>(null);
  // Generate greeting based on available profile data
  const getGreeting = () => {
    if (!profile?.firstName) {
      return "Hi there! Ask me anything about my work, experience, or projects.";
    }

    // The .filter(Boolean) removes all falsy values from the array, so if the firstName or lastName is not set, it will be removed
    const fullName = [profile.firstName, profile.lastName]
      .filter(Boolean)
      .join(" ");

    return `Hi! I'm ${fullName}. Ask me anything about my work, experience, or projects.`;
  };

  const { control } = useChatKit({
    api: {
      getClientSecret: async (_existingSecret) => {
        // Called on initial load and when session needs refresh, we dont actuall use the existing secret as userId is managed by Clerk
        setLimitReached(false);
        try {
          return await createSession();
        } catch (error) {
          if (isUsageLimitError(error)) {
            setLimitReached(true);
            if (error instanceof UsageLimitError) {
              setUsage(
                buildUsageStatusResponse({
                  status: error.details.status,
                  limits: error.details.limits,
                }),
              );
            }
          }
          throw error;
        }
      },
    },
    onLog: (event) => {
      if (!isMessageSendLog(event)) {
        return;
      }

      void (async () => {
        logAbortRef.current?.abort();
        const controller = new AbortController();
        logAbortRef.current = controller;
        try {
          const payload = await fetchUsageStatus(fetch, "/api/chat/message", {
            method: "POST",
            signal: controller.signal,
          });
          if (!payload || controller.signal.aborted || !isMountedRef.current) {
            return;
          }
          setUsage(payload);
        } catch (error) {
          if (
            controller.signal.aborted ||
            (error instanceof DOMException && error.name === "AbortError")
          ) {
            return;
          }
          console.error("Failed to fetch usage status", error);
        }
      })();
    },
    // https://chatkit.studio/playground
    theme: {},
    header: {
      title: {
        text: `Chat with ${profile?.firstName || "Me"} `,
      },
      leftAction: {
        icon: "close",
        onClick: () => {
          toggleSidebar();
        },
      },
    },
    startScreen: {
      greeting: getGreeting(),
      prompts: [
        {
          icon: "suitcase",
          label: "What's your experience?",
          prompt:
            "Tell me about your professional experience and previous roles",
        },
        {
          icon: "square-code",
          label: "What skills do you have?",
          prompt:
            "What technologies and programming languages do you specialize in?",
        },
        {
          icon: "cube",
          label: "What have you built?",
          prompt: "Show me some of your most interesting projects",
        },
        {
          icon: "profile",
          label: "Who are you?",
          prompt: "Tell me more about yourself and your background",
        },
      ],
    },
    composer: {
      models: [
        {
          id: "crisp",
          label: "Crisp",
          description: "Concise and factual",
        },
        {
          id: "clear",
          label: "Clear",
          description: "Focused and helpful",
        },
        {
          id: "chatty",
          label: "Chatty",
          description: "Conversational companion",
        },
      ],
    },

    disclaimer: {
      text: "Disclaimer: This is my AI-powered twin. It may not be 100% accurate and should be verified for accuracy.",
    },
  });

  useEffect(() => {
    const controller = new AbortController();
    usageAbortRef.current?.abort();
    usageAbortRef.current = controller;

    void (async () => {
      try {
        const payload = await fetchUsageStatus(fetch, "/api/chat/usage", {
          signal: controller.signal,
        });
        if (!payload || controller.signal.aborted || !isMountedRef.current) {
          return;
        }
        setUsage(payload);
      } catch (error) {
        if (
          controller.signal.aborted ||
          (error instanceof DOMException && error.name === "AbortError")
        ) {
          return;
        }
        console.error("Failed to fetch usage status on mount", error);
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      usageAbortRef.current?.abort();
      logAbortRef.current?.abort();
    };
  }, []);

  const banner = buildUsageBannerState({ usage, limitReached });

  return (
    <div className="h-full w-full z-50 flex flex-col">
      {banner ? (
        <div
          className={
            banner.tone === "limit"
              ? "mb-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
              : "mb-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          }
        >
          <div className="flex flex-wrap items-center gap-2">
            <span>{banner.message}</span>
            {banner.showCta ? (
              <a className="font-semibold underline" href="/sign-in">
                Sign in
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      <ChatKit control={control} className="h-full w-full flex-1" />
    </div>
  );
}

export default Chat;
