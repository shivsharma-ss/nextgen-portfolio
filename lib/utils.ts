/**
 * Purpose: Provide shared utility helpers for the frontend.
 * Main responsibilities: Compose class names for Tailwind-based components.
 * Key collaborators: Used across UI components to merge class strings.
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Purpose: Merge conditional class names into a single string.
 * Main responsibilities: Combine clsx output with Tailwind class merging.
 * Inputs/outputs: Accepts class fragments and returns a merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
