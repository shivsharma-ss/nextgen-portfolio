/**
 * Purpose: Serve the embedded Sanity Studio authoring environment.
 * Main responsibilities: Mount NextStudio for all Studio routes.
 * Key collaborators: Uses Sanity Studio config from `sanity.config.ts`.
 * Notes/assumptions: Catch-all route handles all nested Studio paths.
 */

import { NextStudio } from "next-sanity/studio";
import config from "../../../sanity.config";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

/**
 * Purpose: Render the Sanity Studio application in Next.js.
 * Main responsibilities: Pass the Studio config into NextStudio.
 * Outputs: Returns the Studio React tree.
 */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
