/**
 * Purpose: Centralize ChatKit UI configuration and constants.
 * Main responsibilities: Provide workflow IDs, prompts, and theme settings.
 * Key collaborators: Used by chat UI components and session setup.
 * Notes/assumptions: Workflow ID is read from NEXT_PUBLIC_CHATKIT_WORKFLOW_ID.
 */
import type {
  ColorScheme,
  StartScreenPrompt,
  ThemeOption,
} from "@openai/chatkit-react";

/**
 * Purpose: Capture the ChatKit workflow identifier for session creation.
 * Main responsibilities: Provide a trimmed workflow ID for API requests.
 * Notes/assumptions: Empty string disables session creation in callers.
 */
export const WORKFLOW_ID =
  process.env.NEXT_PUBLIC_CHATKIT_WORKFLOW_ID?.trim() ?? "";

/**
 * Purpose: Define the API route used to create ChatKit sessions.
 * Main responsibilities: Provide a single source of truth for callers.
 */
export const CREATE_SESSION_ENDPOINT = "/api/create-session";

/**
 * Purpose: Provide suggested prompts for the chat start screen.
 * Main responsibilities: Seed the chat UI with example questions.
 */
export const STARTER_PROMPTS: StartScreenPrompt[] = [
  {
    label: "What can you do?",
    prompt: "What can you do?",
    icon: "circle-question",
  },
];

/**
 * Purpose: Define the default chat input placeholder text.
 * Main responsibilities: Keep placeholder copy consistent across the UI.
 */
export const PLACEHOLDER_INPUT = "Ask anything...";

/**
 * Purpose: Provide the default chat greeting message.
 * Main responsibilities: Set the first message in the chat UI.
 */
export const GREETING = "How can I help you today?";

/**
 * Purpose: Build a ChatKit theme configuration from a color scheme.
 * Main responsibilities: Define palette and radius settings for the UI.
 * Inputs/outputs: Accepts a color scheme and returns a theme option object.
 */
export const getThemeConfig = (theme: ColorScheme): ThemeOption => ({
  color: {
    grayscale: {
      hue: 220,
      tint: 6,
      shade: theme === "dark" ? -1 : -4,
    },
    accent: {
      primary: theme === "dark" ? "#f1f5f9" : "#0f172a",
      level: 1,
    },
  },
  radius: "round",
  // Add other theme options here
  // chatkit.studio/playground to explore config options
});
