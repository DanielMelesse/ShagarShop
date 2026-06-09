import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import {
  ALLOWED_PRODUCT_IMAGE_TYPES,
  MAX_PRODUCT_IMAGE_BYTES,
  getUploadDir,
  isUploadBlob,
  resolveUploadMime,
} from "@/lib/product-image";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const entry = formData.get("file");

    if (!isUploadBlob(entry)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    const filenameHint =
      "name" in entry && typeof entry.name === "string" ? entry.name : "upload";
    const mime = resolveUploadMime(entry.type, filenameHint);

    if (!mime) {
      return NextResponse.json(
        { error: "Use a JPEG, PNG, WebP, or GIF image." },
        { status: 400 },
      );
    }

    const size = entry.size ?? 0;
    if (size > MAX_PRODUCT_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "Image must be 5 MB or smaller." },
        { status: 400 },
      );
    }

    const ext = ALLOWED_PRODUCT_IMAGE_TYPES.get(mime)!;
    const filename = `${session.user.id.slice(0, 8)}-${Date.now().toString(36)}${ext}`;
    const uploadDir = getUploadDir();
    await mkdir(uploadDir, { recursive: true });

    const bytes = Buffer.from(await entry.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Image file is empty." }, { status: 400 });
    }

    await writeFile(path.join(uploadDir, filename), bytes);

    return NextResponse.json({ url: `/uploads/products/${filename}` });
  } catch (error) {
    console.error("[seller/upload]", error);
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }
}
