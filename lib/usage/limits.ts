import {
  DEFAULT_USAGE_LIMITS,
  type UsageLimitsConfig,
} from "@/lib/usage/config";

export type UsageLimitsInput = {
  isSignedIn: boolean;
  config?: UsageLimitsConfig;
};

export const selectUsageLimits = ({
  isSignedIn,
  config = DEFAULT_USAGE_LIMITS,
}: UsageLimitsInput) => {
  return isSignedIn ? config.authLimits : config.freeLimits;
};
