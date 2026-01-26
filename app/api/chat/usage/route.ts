import { auth } from "@clerk/nextjs/server";
import { cookies, headers } from "next/headers";
import { VISITOR_ID_COOKIE_NAME } from "@/components/usage/VisitorBootstrap";
import { migrateUsageDb } from "@/lib/db/migrate";
import { isUsageDbConfigured, openUsageDb } from "@/lib/db/sqlite";
import {
  buildUsageStatusResponse,
  createUnlimitedUsageStatus,
} from "@/lib/usage/api";
import { buildVisitorIdentity } from "@/lib/usage/identity";
import { selectUsageLimits } from "@/lib/usage/limits";
import { loadUsageLimitsConfig } from "@/lib/usage/sanityConfig";
import { resolveClientIp } from "@/lib/usage/session";
import { createUsageStore } from "@/lib/usage/store";

export const runtime = "nodejs";

export async function GET() {
  const { userId } = await auth();
  const headerStore = await headers();
  const cookieStore = await cookies();

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

  if (!isUsageDbConfigured()) {
    const fallbackStatus = createUnlimitedUsageStatus();
    return Response.json(
      buildUsageStatusResponse({ status: fallbackStatus, limits }),
    );
  }

  const db = openUsageDb();
  try {
    migrateUsageDb({ db });
    const store = createUsageStore(db);
    const status = store.getStatus({
      subject: identity.subject,
      sessionsPerDay: limits.sessionsPerDay,
      messagesPerDay: limits.messagesPerDay,
    });

    return Response.json(buildUsageStatusResponse({ status, limits }));
  } finally {
    db.close();
  }
}
