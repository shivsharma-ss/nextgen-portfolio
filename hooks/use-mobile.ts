/**
 * Purpose: Provide a responsive hook for mobile layout detection.
 * Main responsibilities: Track viewport size against a mobile breakpoint.
 * Notes/assumptions: Runs only in the browser where `window` is available.
 */
import * as React from "react";

/**
 * Purpose: Define the max-width breakpoint for mobile layouts.
 * Main responsibilities: Keep a consistent threshold across the app.
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Purpose: Determine whether the current viewport is mobile sized.
 * Main responsibilities: Subscribe to media query changes and update state.
 * Outputs: Returns true when the viewport is below the breakpoint.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}
