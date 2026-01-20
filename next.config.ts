/**
 * Purpose: Define the Next.js build and runtime configuration.
 * Main responsibilities: Configure framework options such as image handling.
 * Key collaborators: Next.js runtime reads this during build/startup.
 * Notes/assumptions: Image hosts must match external CMS and asset sources.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
