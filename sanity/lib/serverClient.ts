/**
 * Purpose: Configure a server-side Sanity client with write access.
 * Main responsibilities: Use a private token and disable CDN for fresh data.
 * Key collaborators: Reads configuration from `sanity/env`.
 * Notes/assumptions: Requires SANITY_API_TOKEN in the server environment.
 */
import { createClient } from "next-sanity";

import { apiVersion, dataset, projectId } from "../env";

/**
 * Purpose: Read the Sanity API token for server mutations.
 * Main responsibilities: Enable authenticated requests from server actions.
 * Notes/assumptions: Token is undefined in the browser.
 */
const token = process.env.SANITY_API_TOKEN;

/**
 * Purpose: Create the authenticated Sanity client for server actions.
 * Main responsibilities: Provide fresh reads and write capabilities.
 * Notes/assumptions: Uses `SANITY_API_TOKEN` to authorize mutations.
 */
export const serverClient = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: false, // Ensure fresh data for server actions
  token,
});
