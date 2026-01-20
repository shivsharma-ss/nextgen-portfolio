/**
 * Purpose: Configure the shared Sanity client for browser-safe queries.
 * Main responsibilities: Provide a CDN-backed client with stega preview support.
 * Key collaborators: Reads configuration from `sanity/env`.
 * Notes/assumptions: Uses the public Studio URL for stega annotations.
 */
import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Purpose: Create the default Sanity client for read operations.
 * Main responsibilities: Configure API version, dataset, and CDN usage.
 * Notes/assumptions: CDN is enabled for faster, cache-friendly reads.
 */
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
  stega: {
    studioUrl: process.env.NEXT_PUBLIC_SANITY_STUDIO_URL,
  },
});
