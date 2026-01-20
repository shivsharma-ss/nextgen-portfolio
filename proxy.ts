/**
 * Purpose: Register Clerk authentication middleware for Next.js routes.
 * Main responsibilities: Protect matched routes with Clerk session handling.
 * Key collaborators: Next.js middleware pipeline and Clerk server middleware.
 * Notes/assumptions: Route matcher excludes static assets and Next.js internals.
 */
import { clerkMiddleware } from "@clerk/nextjs/server";

/**
 * Purpose: Create the default Clerk middleware handler.
 * Main responsibilities: Attach auth/session processing to matching requests.
 * Side effects: Reads auth cookies/headers on each matched request.
 */
export default clerkMiddleware();

/**
 * Purpose: Configure which routes invoke the Clerk middleware.
 * Main responsibilities: Skip static assets while covering API routes.
 * Notes/assumptions: Matcher patterns follow Next.js middleware syntax.
 */
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
