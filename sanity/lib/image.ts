/**
 * Purpose: Build image URLs for Sanity assets.
 * Main responsibilities: Provide a configured URL builder for image transforms.
 * Key collaborators: Uses project settings from `sanity/env`.
 */

import type { SanityImageSource } from "@sanity/image-url";
import createImageUrlBuilder from "@sanity/image-url";

import { dataset, projectId } from "../env";

/**
 * Purpose: Create the shared Sanity image URL builder.
 * Main responsibilities: Bind project and dataset to image URL generation.
 */
const builder = createImageUrlBuilder({ projectId, dataset });

/**
 * Purpose: Generate a chainable image URL builder for a given source.
 * Main responsibilities: Accept Sanity image sources and return a builder.
 * Outputs: Returns an image builder that can add transforms.
 */
export const urlFor = (source: SanityImageSource) => {
  return builder.image(source);
};

type ImageUrlOptions = {
  width?: number;
  height?: number;
};

/**
 * Purpose: Safely build an image URL for optional image data.
 * Main responsibilities: Guard against missing assets and builder errors.
 * Outputs: Returns a URL string or null when invalid.
 */
export const getImageUrl = (
  source: SanityImageSource | null | undefined,
  options: ImageUrlOptions = {},
) => {
  if (!source) return null;

  try {
    let imageBuilder = urlFor(source);

    if (typeof options.width === "number") {
      imageBuilder = imageBuilder.width(options.width);
    }

    if (typeof options.height === "number") {
      imageBuilder = imageBuilder.height(options.height);
    }

    return imageBuilder.url();
  } catch {
    return null;
  }
};
