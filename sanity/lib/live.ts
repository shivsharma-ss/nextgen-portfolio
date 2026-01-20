/**
 * Purpose: Enable Sanity Live Content API helpers for the app.
 * Main responsibilities: Provide sanityFetch and SanityLive for realtime updates.
 * Key collaborators: Uses the shared Sanity client and API tokens.
 * Notes/assumptions: Tokens must be configured for live content updates.
 */
import { defineLive } from "next-sanity/live";
import { client } from "./client";

/**
 * Purpose: Create live-query helpers for Sanity content.
 * Main responsibilities: Return fetch helper and live component bindings.
 * Side effects: Uses tokens for authenticated subscription updates.
 */
export const { sanityFetch, SanityLive } = defineLive({
  client,
  serverToken: process.env.SANITY_API_TOKEN,
  browserToken: process.env.SANITY_API_TOKEN,
});
