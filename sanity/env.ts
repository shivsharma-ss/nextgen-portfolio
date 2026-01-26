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
  process.env.SANITY_STUDIO_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET,
  "Missing environment variable: SANITY_STUDIO_DATASET or NEXT_PUBLIC_SANITY_DATASET",
);

/**
 * Purpose: Resolve the Sanity project ID.
 * Main responsibilities: Validate presence of project configuration.
 * Errors: Throws when SANITY_STUDIO_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID is missing.
 */
/**
 * Purpose: Provide the shared project ID during local development when
 * a developer has not yet configured their environment.
 */
const fallbackProjectId =
  process.env.NODE_ENV === "development" ? "mdokvla9" : undefined;

export const projectId = assertValue(
  process.env.SANITY_STUDIO_PROJECT_ID ??
    process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ??
    fallbackProjectId,
  "Missing environment variable: SANITY_STUDIO_PROJECT_ID or NEXT_PUBLIC_SANITY_PROJECT_ID",
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
