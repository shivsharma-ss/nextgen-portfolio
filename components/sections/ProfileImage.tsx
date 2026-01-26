"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { MessageCircle, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { UsageStatusResponse } from "@/lib/usage/api";
import {
  fetchUsageStatus,
  getProfileImageUsageState,
} from "@/lib/usage/client";
import { useSidebar } from "../ui/sidebar";

interface ProfileImageProps {
  imageUrl: string;
  firstName: string;
  lastName: string;
}

export function ProfileImage({
  imageUrl,
  firstName,
  lastName,
}: ProfileImageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toggleSidebar, open } = useSidebar();
  const { isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const [usage, setUsage] = useState<UsageStatusResponse | null>(null);
  const [usageError, setUsageError] = useState<Error | null>(null);

  const { isUsageLimited, shouldGateWithSignIn, tooltipText } =
    getProfileImageUsageState({
      isSignedIn: Boolean(isSignedIn),
      usage,
    });

  const tooltipTextWithError = usageError
    ? `${tooltipText} (usage data unavailable)`
    : tooltipText;

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        const payload = await fetchUsageStatus(fetch, "/api/chat/usage", {
          signal: controller.signal,
        });
        if (!payload || controller.signal.aborted) {
          return;
        }
        setUsage(payload);
      } catch (error) {
          if (controller.signal.aborted) return;
          if (error instanceof DOMException && error.name === "AbortError")
            return;
          console.error(error);
          setUsageError(
            error instanceof Error ? error : new Error("Usage fetch failed"),
          );
      }
    })();

    return () => {
      controller.abort();
    };
  }, []);

  const handleClick = () => {
    if (!open && shouldGateWithSignIn) {
      openSignIn();
      return;
    }

    toggleSidebar();
  };

  const headlineText = open
    ? "Close Chat"
    : shouldGateWithSignIn
      ? "Sign in to continue"
      : "Chat with AI Twin";
  const subText = open
    ? "Click to close chat"
    : shouldGateWithSignIn
      ? "Daily limit reached"
      : "Click to open chat";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="relative aspect-square rounded-2xl overflow-hidden border-4 border-primary/20 block group cursor-pointer w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsHovered(true)}
      onBlur={() => setIsHovered(false)}
      aria-label={
        shouldGateWithSignIn
          ? "Sign in to continue chatting"
          : "Toggle AI Chat Sidebar"
      }
      title={tooltipTextWithError}
    >
      <Image
        src={imageUrl}
        alt={`${firstName} ${lastName}`}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority
      />

      {/* Online Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
        <div className="relative">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping" />
        </div>
        <span className="text-xs font-medium text-white">Online</span>
      </div>

      {isUsageLimited ? (
        <div className="absolute top-4 left-4 flex items-center gap-2 bg-amber-500/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="text-xs font-semibold text-white">
            Limit reached
          </span>
        </div>
      ) : null}

      {/* Hover Overlay */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300 ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="text-center space-y-3">
          {open ? (
            <X className="w-12 h-12 text-white mx-auto" />
          ) : (
            <MessageCircle className="w-12 h-12 text-white mx-auto" />
          )}

          <div className="text-white text-xl font-semibold">{headlineText}</div>
          <div className="text-white/80 text-sm">{subText}</div>
        </div>
      </div>
    </button>
  );
}
