import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { guessMimeFromFilename, isUploadBlob, resolveUploadMime } from "@/lib/product-image";

export const LICENSE_UPLOAD_PREFIX = "/uploads/licenses/";
const LICENSE_PATH_PATTERN = /^\/uploads\/licenses\/[a-zA-Z0-9._-]+$/;
export const MAX_LICENSE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_LICENSE_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["application/pdf", ".pdf"],
]);

export function getLicenseUploadDir(): string {
  return `${process.cwd()}/public/uploads/licenses`;
}

export function resolveLicenseMime(
  reportedType: string,
  filename: string,
): string | null {
  const normalized = reportedType.toLowerCase().split(";")[0]?.trim() ?? "";
  if (ALLOWED_LICENSE_TYPES.has(normalized)) {
    return normalized;
  }
  if (normalized === "application/octet-stream" || normalized === "" || normalized === "image/jpg") {
    const guessed = guessMimeFromFilename(filename);
    if (guessed && ALLOWED_LICENSE_TYPES.has(guessed)) return guessed;
    if (filename.toLowerCase().endsWith(".pdf")) return "application/pdf";
  }
  return null;
}

export function isValidLicensePath(value: string): boolean {
  return LICENSE_PATH_PATTERN.test(value.trim());
}

export function licenseUploadErrorMessage(): string {
  return "Upload a license file (PDF, JPEG, PNG, or WebP, max 10 MB).";
}

export async function saveLicenseFile(
  userId: string,
  file: File,
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const filenameHint = file.name || "license";
  const mime = resolveLicenseMime(file.type, filenameHint);

  if (!mime) {
    return { ok: false, error: licenseUploadErrorMessage() };
  }

  if (file.size > MAX_LICENSE_BYTES) {
    return { ok: false, error: "License file must be 10 MB or smaller." };
  }

  const ext = ALLOWED_LICENSE_TYPES.get(mime)!;
  const filename = `${userId.slice(0, 8)}-${Date.now().toString(36)}${ext}`;
  const uploadDir = getLicenseUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length === 0) {
    return { ok: false, error: "License file is empty." };
  }

  await writeFile(path.join(uploadDir, filename), bytes);
  return { ok: true, url: `${LICENSE_UPLOAD_PREFIX}${filename}` };
}
