const UPLOAD_PATH_PREFIX = "/uploads/products/";
const UPLOAD_PATH_PATTERN = /^\/uploads\/products\/[a-zA-Z0-9._-]+$/;

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;

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

export function getUploadDir(): string {
  return `${process.cwd()}/public/uploads/products`;
}

export function isManagedUploadPath(value: string): boolean {
  return value.startsWith(UPLOAD_PATH_PREFIX);
}

export function shouldUnoptimizeProductImage(src: string): boolean {
  return src.startsWith(UPLOAD_PATH_PREFIX);
}
