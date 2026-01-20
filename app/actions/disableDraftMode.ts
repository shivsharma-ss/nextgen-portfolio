"use server";

/**
 * Purpose: Provide a server action to disable Next.js draft mode.
 * Main responsibilities: Turn off draft mode and wait briefly for state to settle.
 * Notes/assumptions: Uses a short delay to ensure cookies propagate.
 */
import { draftMode } from "next/headers";

/**
 * Purpose: Disable draft mode for the current request context.
 * Main responsibilities: Call Next.js draftMode disable and await a short delay.
 * Side effects: Updates draft mode cookies for the user.
 */
export async function disableDraftMode() {
  const disable = (await draftMode()).disable();
  const delay = new Promise((resolve) => setTimeout(resolve, 1000));

  await Promise.allSettled([disable, delay]);
}
