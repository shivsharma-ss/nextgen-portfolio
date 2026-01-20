/**
 * Purpose: Show a centered loading state while the portfolio page streams.
 * Main responsibilities: Render a minimal spinner-based fallback UI.
 * Key collaborators: Uses the shared Spinner component.
 */
import { Spinner } from "@/components/ui/spinner";

/**
 * Purpose: Provide a consistent loading placeholder for page transitions.
 * Main responsibilities: Center the spinner within the viewport.
 * Outputs: Returns loading state JSX.
 */
function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}

export default Loading;
