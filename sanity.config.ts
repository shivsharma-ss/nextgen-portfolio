"use client";

/**
 * Purpose: Configure the Sanity Studio embedded in the Next.js app.
 * Main responsibilities: Define studio title, schema, and editor plugins.
 * Key collaborators: Imports schema and structure from `sanity/schemaTypes` and `sanity/structure`.
 * Notes/assumptions: The Studio is mounted at `/studio` and uses preview mode routes.
 */
import { RocketIcon } from "@sanity/icons";
import { visionTool } from "@sanity/vision";
import { defineConfig } from "sanity";
import { presentationTool } from "sanity/presentation";
import { structureTool } from "sanity/structure";
// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import { apiVersion, dataset, projectId } from "./sanity/env";
import { schema } from "./sanity/schemaTypes";
import { structure } from "./sanity/structure";

export default defineConfig({
  basePath: "/studio",
  projectId,
  dataset,
  title: "Portfolio Studio",
  subtitle: "Content Management",
  // Version: 1.3.0 - Force schema refresh for skill categories visibility
  // Cache buster: 2026-01-24T15:10:00Z
  // Custom studio icon
  icon: RocketIcon,

  // Add and edit the content schema in the './sanity/schemaTypes' folder
  schema,

  plugins: [
    structureTool({
      structure,
      title: "Content",
    }),
    presentationTool({
      previewUrl: {
        initial:
          process.env.SANITY_STUDIO_PREVIEW_ORIGIN ||
          "https://shivansh-sharma.vercel.app",
        preview: "/",
        previewMode: {
          enable: "/api/draft-mode/enable",
        },
      },
    }),
    // Vision is for querying with GROQ from inside the Studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({
      defaultApiVersion: apiVersion,
      title: "GROQ",
    }),
  ],
});
