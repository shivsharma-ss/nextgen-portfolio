"use client";

import { useEffect } from "react";

export const VISITOR_ID_STORAGE_KEY = "visitorId";
export const VISITOR_ID_COOKIE_NAME = "visitor_id";
const VISITOR_ID_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type StorageLike = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
};

export type VisitorBootstrapEnv = {
  localStorage?: StorageLike;
  cookie?: string;
  setCookie?: (value: string) => void;
  crypto?: Crypto | undefined;
};

export function readCookieValue(cookie: string, name: string): string | null {
  if (!cookie) {
    return null;
  }

  const prefix = `${name}=`;
  const parts = cookie.split(";");

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) {
      const value = trimmed.slice(prefix.length);
      if (value.length === 0) {
        return null;
      }
      try {
        return decodeURIComponent(value);
      } catch {
        return null;
      }
    }
  }

  return null;
}

export function generateVisitorId(crypto: Crypto | undefined) {
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function bootstrapVisitorId(env: VisitorBootstrapEnv = {}) {
  const localStorage =
    env.localStorage ??
    (typeof window !== "undefined" ? window.localStorage : undefined);
  const cookie =
    env.cookie ?? (typeof document !== "undefined" ? document.cookie : "");
  const setCookie =
    env.setCookie ??
    ((value: string) => {
      if (typeof document !== "undefined") {
        document.cookie = value;
      }
    });
  const isSecure =
    typeof location !== "undefined" && location.protocol === "https:";

  let storedVisitorId: string | null = null;
  if (localStorage) {
    try {
      storedVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY);
    } catch {
      storedVisitorId = null;
    }
  }

  if (storedVisitorId && storedVisitorId.trim().length === 0) {
    storedVisitorId = null;
  }

  const cookieVisitorId = readCookieValue(cookie, VISITOR_ID_COOKIE_NAME);
  const visitorId =
    storedVisitorId ??
    cookieVisitorId ??
    generateVisitorId(env.crypto ?? globalThis.crypto);

  if (localStorage && storedVisitorId !== visitorId) {
    try {
      localStorage.setItem(VISITOR_ID_STORAGE_KEY, visitorId);
    } catch {
      // Ignore storage write failures.
    }
  }

  if (cookieVisitorId !== visitorId) {
    const secureAttribute = isSecure ? "; Secure" : "";
    setCookie(
      `${VISITOR_ID_COOKIE_NAME}=${encodeURIComponent(
        visitorId,
      )}; Path=/; SameSite=Lax; Max-Age=${VISITOR_ID_COOKIE_MAX_AGE}${secureAttribute}`,
    );
  }

  return visitorId;
}

export default function VisitorBootstrap() {
  useEffect(() => {
    bootstrapVisitorId();
  }, []);

  return null;
}
