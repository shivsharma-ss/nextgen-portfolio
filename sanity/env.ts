/**
 * Purpose: Centralize Sanity environment configuration for the app.
 * Main responsibilities: Resolve API version, dataset, and project ID.
 * Key collaborators: Used by Sanity clients and Studio config.
 * Notes/assumptions: Required values must be present in environment variables.
 */
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-17";

/**
 * Purpose: Resolve the active Sanity dataset name.
 * Main responsibilities: Validate presence of dataset configuration.
 * Errors: Throws when NEXT_PUBLIC_SANITY_DATASET is missing.
 */
export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: NEXT_PUBLIC_SANITY_DATASET",
);

/**
 * Purpose: Resolve the Sanity project ID.
 * Main responsibilities: Validate presence of project configuration.
 * Errors: Throws when NEXT_PUBLIC_SANITY_PROJECT_ID is missing.
 */
export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  "Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID",
);

/**
 * Purpose: Assert that a required environment value is present.
 * Main responsibilities: Fail fast with a clear configuration error.
 * Inputs/outputs: Returns the value when defined, otherwise throws.
 */
function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage);
  }

  return v;
}
