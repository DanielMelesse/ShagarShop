import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadDir } from "@/lib/product-image";

export const runtime = "nodejs";

const SAFE_FILENAME = /^[a-zA-Z0-9._-]+$/;

interface RouteContext {
  params: Promise<{ filename: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { filename } = await context.params;

  if (!SAFE_FILENAME.test(filename) || filename.includes("..")) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const filePath = path.join(getUploadDir(), filename);
  const resolvedDir = path.resolve(getUploadDir());
  const resolvedFile = path.resolve(filePath);
  if (!resolvedFile.startsWith(resolvedDir + path.sep)) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  try {
    const info = await stat(resolvedFile);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const bytes = await readFile(resolvedFile);
    const contentType = filename.endsWith(".png")
      ? "image/png"
      : filename.endsWith(".gif")
        ? "image/gif"
        : filename.endsWith(".jpg") || filename.endsWith(".jpeg")
          ? "image/jpeg"
          : "image/webp";

    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
