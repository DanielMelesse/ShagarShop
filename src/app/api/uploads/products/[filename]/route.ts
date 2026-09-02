import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadDir } from "@/lib/product-image";

export const runtime = "nodejs";

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

interface RouteContext {
  params: Promise<{ filename: string }>;
}

function contentTypeForFilename(filename: string): string {
  if (filename.endsWith(".png")) return "image/png";
  if (filename.endsWith(".gif")) return "image/gif";
  if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) return "image/jpeg";
  return "image/webp";
}

async function readUploadBytes(filename: string): Promise<Buffer | null> {
  if (!SAFE_FILENAME.test(filename) || filename.includes("..")) {
    return null;
  }

  const uploadDir = getUploadDir();
  const resolvedDir = path.resolve(uploadDir);
  const resolvedFile = path.resolve(path.join(uploadDir, filename));

  if (!resolvedFile.startsWith(resolvedDir + path.sep)) {
    return null;
  }

  try {
    const info = await stat(resolvedFile);
    if (!info.isFile()) return null;
    return readFile(resolvedFile);
  } catch {
    // Card thumb missing — fall back to full gallery WebP.
    if (filename.includes("-card.")) {
      const galleryName = filename.replace("-card.", ".");
      return readUploadBytes(galleryName);
    }
    return null;
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;
  const bytes = await readUploadBytes(filename);

  if (!bytes) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(bytes), {
    status: 200,
    headers: {
      "Content-Type": contentTypeForFilename(filename),
      "Content-Length": String(bytes.length),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
