/**
 * Purpose: Configure Clerk middleware with optional authentication for Next.js routes.
 * Main responsibilities: Allow guest access to public routes while protecting specific routes.
 * Key collaborators: Next.js middleware pipeline and Clerk server middleware with route matching.
 * Notes/assumptions: Route matcher excludes static assets and Next.js internals.
 */
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/**
 * Purpose: Define which routes are public (don't require authentication).
 * Main responsibilities: Allow guest access to chat API and essential pages.
 * Side effects: Guests can browse public areas without sign-in requirements.
 */
const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/chat(.*)", // Allow guest access to chat API
  "/", // Allow guests to browse homepage
  "/about(.*)", // Allow guests to view about page
  "/projects(.*)", // Allow guests to view projects
  "/contact(.*)", // Allow guests to view contact page
  // Add other public routes as needed
]);

/**
 * Purpose: Create Clerk middleware handler with optional authentication.
 * Main responsibilities: Protect only non-public routes while allowing guest access.
 * Side effects: Auth context available for signed-in users on all routes.
 */
export default clerkMiddleware(async (auth, req) => {
  // Only protect routes that are not public
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
  // For public routes, auth is optional - guests can access
  // Signed-in users will have auth context available
});

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
