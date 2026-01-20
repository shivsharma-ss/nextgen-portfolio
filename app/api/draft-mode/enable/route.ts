/**
 * Purpose: Expose a GET route to enable Sanity draft mode.
 * Main responsibilities: Configure draft-mode handler with a tokened Sanity client.
 * Key collaborators: Uses `sanity/lib/client` and next-sanity draft utilities.
 * Notes/assumptions: Requires SANITY_VIEWER_TOKEN for preview access.
 */
import { defineEnableDraftMode } from "next-sanity/draft-mode";
import { client } from "@/sanity/lib/client";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({
    token: process.env.SANITY_VIEWER_TOKEN,
  }),
});
