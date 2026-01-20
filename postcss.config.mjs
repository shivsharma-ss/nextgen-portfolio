/**
 * Purpose: Configure PostCSS plugins for the build pipeline.
 * Main responsibilities: Enable Tailwind CSS processing.
 * Key collaborators: Used by Next.js during CSS compilation.
 */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
