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

const resolveUsageSalt = () => {
  if (process.env.USAGE_SALT) {
    return process.env.USAGE_SALT;
  }

  if (process.env.NODE_ENV !== "production") {
    return "dev-usage-salt";
  }

  throw new Error("USAGE_SALT is required in production");
};

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

  const trimmedIp = ip.trim();
  const subjectSeed = trimmedIp === "" ? visitorId : trimmedIp;
  const hash = hashVisitorFingerprint(subjectSeed, userAgent);
  return { subject: hash, tier: "guest" };
};
