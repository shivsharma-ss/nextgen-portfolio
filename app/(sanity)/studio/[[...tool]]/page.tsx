/**
 * Purpose: Serve the embedded Sanity Studio authoring environment.
 * Main responsibilities: Mount NextStudio for all Studio routes.
 * Key collaborators: Uses Sanity Studio config from `sanity.config.ts`.
 * Notes/assumptions: Catch-all route handles all nested Studio paths.
 */

import { NextStudio } from "next-sanity/studio";
import config from "@/sanity.config";

export { metadata, viewport } from "next-sanity/studio";

// Generate the base studio route for static generation
/**
 * Purpose: Provide a static params list for Studio routing.
 * Main responsibilities: Ensure the base Studio route is generated.
 * Outputs: Returns an array with an empty tool path.
 */
export function generateStaticParams() {
  return [{ tool: [] }];
}

/**
 * Purpose: Render the Sanity Studio application in Next.js.
 * Main responsibilities: Pass the Studio config into NextStudio.
 * Outputs: Returns the Studio React tree.
 */
export default function StudioPage() {
  return <NextStudio config={config} />;
}
