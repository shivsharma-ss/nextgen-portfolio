/**
 * Purpose: Configure the Sanity CLI for this repository.
 * Main responsibilities: Point CLI commands at the correct project and dataset.
 * Key collaborators: Reads project settings from environment variables.
 * Notes/assumptions: Requires NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET.
 */
import { defineCliConfig } from "sanity/cli";

/**
 * Purpose: Resolve the Sanity project ID from the environment.
 * Main responsibilities: Provide CLI access to the correct Sanity project.
 * Notes/assumptions: Must be set in the local environment for CLI commands.
 */
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;

/**
 * Purpose: Resolve the Sanity dataset name from the environment.
 * Main responsibilities: Tell the CLI which dataset to target.
 * Notes/assumptions: Must be set in the local environment for CLI commands.
 */
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;

export default defineCliConfig({ api: { projectId, dataset } });
