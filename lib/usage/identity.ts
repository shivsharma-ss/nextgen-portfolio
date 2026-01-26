import { createHash } from "node:crypto";

type VisitorIdentityInput = {
  ip: string;
  userAgent: string;
  visitorId: string;
  // Empty string is treated as absent.
  clerkUserId?: string;
};

type VisitorIdentity = {
  subject: string;
  tier: "authenticated" | "guest";
};

const fingerprintDelimiter = "\u0000";

const resolveUsageSalt = () =>
  process.env.USAGE_SALT ?? process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID ?? "";

export const hashVisitorFingerprint = (
  subjectSeed: string,
  userAgent: string,
) => {
  const fingerprintInput = [resolveUsageSalt(), subjectSeed, userAgent].join(
    fingerprintDelimiter,
  );
  return createHash("sha256").update(fingerprintInput).digest("hex");
};

export const buildVisitorIdentity = ({
  ip,
  userAgent,
  visitorId,
  clerkUserId,
}: VisitorIdentityInput): VisitorIdentity => {
  if (clerkUserId !== undefined && clerkUserId !== "") {
    return { subject: clerkUserId, tier: "authenticated" };
  }

  const subjectSeed = ip.trim() === "" ? visitorId : ip;
  const hash = hashVisitorFingerprint(subjectSeed, userAgent);
  return { subject: hash, tier: "guest" };
};
