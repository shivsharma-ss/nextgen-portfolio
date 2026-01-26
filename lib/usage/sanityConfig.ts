import { sanityFetch } from "@/sanity/lib/live";
import {
  DEFAULT_USAGE_LIMITS,
  normalizeUsageLimits,
  type UsageLimitsDoc,
} from "./config";

export async function fetchUsageLimitsConfig({
  revalidate = 60,
}: {
  revalidate?: number;
} = {}) {
  const query = `*[_type == "chatUsageLimits" && _id == $id][0]{
    freeSessionsPerDay,
    freeMessagesPerDay,
    authSessionsPerDay,
    authMessagesPerDay,
    sessionMinutes,
    cooldownHours
  }`;

  const sanityOptions: Parameters<typeof sanityFetch>[0] & {
    revalidate?: number | false;
  } = {
    query,
    params: { id: "singleton-chatUsageLimits" },
    revalidate,
  };

  const { data } = await sanityFetch(sanityOptions);

  const doc = data as UsageLimitsDoc | null;

  if (!doc) {
    return DEFAULT_USAGE_LIMITS;
  }

  return normalizeUsageLimits(doc);
}

export async function loadUsageLimitsConfig(opts?: { revalidate?: number }) {
  try {
    return await fetchUsageLimitsConfig(opts);
  } catch (error) {
    console.warn("Failed to load chat usage limits config", error);
    return DEFAULT_USAGE_LIMITS;
  }
}
