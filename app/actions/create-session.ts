"use server";

/**
 * Purpose: Create server actions for initiating ChatKit sessions.
 * Main responsibilities: Support guest access and request OpenAI session secrets.
 * Key collaborators: Clerk auth, OpenAI ChatKit API, and workflow config.
 * Notes/assumptions: Requires OPENAI_API_KEY and WORKFLOW_ID to be set.
 */
import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { VISITOR_ID_COOKIE_NAME } from "@/components/usage/VisitorBootstrap";
import { WORKFLOW_ID } from "@/lib/config";
import { migrateUsageDb } from "@/lib/db/migrate";
import { openUsageDb } from "@/lib/db/sqlite";
import { buildVisitorIdentity } from "@/lib/usage/identity";
import { selectUsageLimits } from "@/lib/usage/limits";
import { loadUsageLimitsConfig } from "@/lib/usage/sanityConfig";
import {
  assertClientSecret,
  buildSessionPayload,
  enforceSessionUsage,
  ensureOpenAiSessionOk,
  resolveClientIp,
} from "@/lib/usage/session";
import { createUsageStore } from "@/lib/usage/store";

/**
 * Purpose: Create a ChatKit session for the current visitor (guest or signed-in).
 * Main responsibilities: Validate configuration, then request a session.
 * Inputs/outputs: Returns a client secret string for the ChatKit SDK.
 * Side effects: Performs a network request to the OpenAI ChatKit API.
 * Errors: Throws when configuration is missing or the API request fails.
 */
export async function createSession() {
  const { userId } = await auth();
  const headerStore = await headers();
  const cookieStore = await cookies();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  if (!WORKFLOW_ID) {
    throw new Error("WORKFLOW_ID not configured");
  }

  const visitorId = cookieStore.get(VISITOR_ID_COOKIE_NAME)?.value ?? "";
  const userAgent = headerStore.get("user-agent") ?? "";
  const ip = resolveClientIp({
    forwardedFor: headerStore.get("x-forwarded-for"),
    realIp: headerStore.get("x-real-ip"),
    isVercel: process.env.VERCEL === "1",
  });
  const identity = buildVisitorIdentity({
    ip,
    userAgent,
    visitorId,
    clerkUserId: userId ?? "",
  });
  const usageConfig = await loadUsageLimitsConfig();
  const limits = selectUsageLimits({
    isSignedIn: Boolean(userId),
    config: usageConfig,
  });

  const db = openUsageDb();
  try {
    migrateUsageDb({ db });
    const store = createUsageStore(db);
    enforceSessionUsage({ store, subject: identity.subject, limits });
  } finally {
    db.close();
  }

  // Create ChatKit session with visitor identity subject
  const response = await fetch("https://api.openai.com/v1/chatkit/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "chatkit_beta=v1",
    },
    body: JSON.stringify(
      buildSessionPayload({ workflowId: WORKFLOW_ID, identity }),
    ),
  });

  await ensureOpenAiSessionOk({ response });

  const data = await response.json();
  return assertClientSecret(data);
}
