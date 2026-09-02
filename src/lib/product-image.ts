const UPLOAD_PATH_PREFIX = "/uploads/products/";
const UPLOAD_PATH_PATTERN = /^\/uploads\/products\/[a-zA-Z0-9._-]+$/;

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PRODUCT_IMAGES = 5;

export type ProductImageVariant = "card" | "gallery" | "thumb";

export const ALLOWED_PRODUCT_IMAGE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
]);

const EXTENSION_MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const VARIANT_WIDTH: Record<ProductImageVariant, number> = {
  thumb: 96,
  card: 400,
  gallery: 800,
};

export function guessMimeFromFilename(filename: string): string | null {
  const lower = filename.toLowerCase();
  for (const [ext, mime] of Object.entries(EXTENSION_MIME)) {
    if (lower.endsWith(ext)) return mime;
  }
  return null;
}

export function resolveUploadMime(
  reportedType: string,
  filename: string,
): string | null {
  const normalized = reportedType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ALLOWED_PRODUCT_IMAGE_TYPES.has(normalized)) {
    return normalized;
  }
  if (
    normalized === "application/octet-stream" ||
    normalized === "" ||
    normalized === "image/jpg"
  ) {
    return guessMimeFromFilename(filename);
  }
  return null;
}

export function isUploadBlob(
  value: FormDataEntryValue | null,
): value is File {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof (value as Blob).arrayBuffer === "function"
  );
}

export function isValidProductImage(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;

  if (trimmed.startsWith(UPLOAD_PATH_PREFIX)) {
    return UPLOAD_PATH_PATTERN.test(trimmed);
  }

  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function productImageErrorMessage(): string {
  return "Add an image file or a valid http/https URL.";
}

export function productImagesErrorMessage(): string {
  return `Add 1 to ${MAX_PRODUCT_IMAGES} images using uploads or valid http/https URLs.`;
}

export function normalizeProductImages(image: string, images?: string[] | null): string[] {
  const fromArray = (images ?? []).map((value) => value.trim()).filter(Boolean);
  if (fromArray.length > 0) return fromArray.slice(0, MAX_PRODUCT_IMAGES);
  const cover = image.trim();
  return cover ? [cover] : [];
}

export function getUploadDir(): string {
  return `${process.cwd()}/public/uploads/products`;
}

export function isManagedUploadPath(value: string): boolean {
  return value.startsWith(UPLOAD_PATH_PREFIX);
}

/** Prefer smaller *-card.webp sibling for new WebP uploads. */
export function toCardUploadPath(src: string): string {
  if (!src.startsWith(UPLOAD_PATH_PREFIX)) return src;
  if (src.includes("-card.")) return src;
  if (src.endsWith(".webp")) {
    return src.replace(/\.webp$/, "-card.webp");
  }
  return src;
}

/** Shrink Unsplash (and similar) remotes for Ethiopia 3G. */
export function optimizeRemoteImageUrl(
  src: string,
  variant: ProductImageVariant = "gallery",
): string {
  try {
    const url = new URL(src);
    if (url.hostname === "images.unsplash.com") {
      url.searchParams.set("w", String(VARIANT_WIDTH[variant]));
      url.searchParams.set("q", "70");
      url.searchParams.set("auto", "format");
      url.searchParams.set("fit", "max");
      return url.toString();
    }
  } catch {
    return src;
  }
  return src;
}

export function resolveProductImageSrc(
  src: string,
  variant: ProductImageVariant = "gallery",
): string {
  const trimmed = src.trim();
  if (!trimmed) return trimmed;

  if (trimmed.startsWith(UPLOAD_PATH_PREFIX)) {
    if (variant === "card" || variant === "thumb") {
      return toCardUploadPath(trimmed);
    }
    return trimmed;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return optimizeRemoteImageUrl(trimmed, variant);
  }

  return trimmed;
}

/** Serve uploads through the API route (reliable for runtime uploads). */
export function productImageServeUrl(
  src: string,
  variant: ProductImageVariant = "gallery",
): string {
  const path = resolveProductImageSrc(src, variant);
  if (path.startsWith(UPLOAD_PATH_PREFIX)) {
    return `/api/uploads/products/${path.slice(UPLOAD_PATH_PREFIX.length)}`;
  }
  return path;
}

/**
 * Local uploads are pre-compressed WebP (serve as static).
 * Remotes use URL params / Next optimizer when possible.
 */
export function shouldUnoptimizeProductImage(src: string): boolean {
  if (src.startsWith(UPLOAD_PATH_PREFIX)) return true;
  // Avoid Bun + Next image optimizer LRU issues on remotes; URLs already sized.
  if (src.startsWith("http://") || src.startsWith("https://")) return true;
  return false;
}
