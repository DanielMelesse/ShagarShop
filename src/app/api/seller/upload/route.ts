import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { storeObject } from "@/lib/object-storage";
import { requireSellerSession } from "@/lib/require-seller";
import {
  MAX_PRODUCT_IMAGE_BYTES,
  getUploadDir,
  isUploadBlob,
  resolveUploadMime,
} from "@/lib/product-image";

export const runtime = "nodejs";

const GALLERY_MAX_EDGE = 1200;
const CARD_MAX_EDGE = 400;
const WEBP_QUALITY = 75;

export async function POST(request: Request) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { session } = auth;

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

    const bytes = Buffer.from(await entry.arrayBuffer());
    if (bytes.length === 0) {
      return NextResponse.json({ error: "Image file is empty." }, { status: 400 });
    }

    const baseName = `${session.user.id.slice(0, 8)}-${Date.now().toString(36)}`;
    const filename = `${baseName}.webp`;
    const cardFilename = `${baseName}-card.webp`;

    const pipeline = sharp(bytes, { animated: false }).rotate();

    const galleryBuf = await pipeline
      .clone()
      .resize({
        width: GALLERY_MAX_EDGE,
        height: GALLERY_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const cardBuf = await pipeline
      .clone()
      .resize({
        width: CARD_MAX_EDGE,
        height: CARD_MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const [galleryStored, cardStored] = await Promise.all([
      storeObject({
        key: `products/${filename}`,
        body: galleryBuf,
        contentType: "image/webp",
        localSubdir: "products",
      }),
      storeObject({
        key: `products/${cardFilename}`,
        body: cardBuf,
        contentType: "image/webp",
        localSubdir: "products",
      }),
    ]);

    // Keep local copies when using disk fallback (API serve route expects paths)
    if (galleryStored.url.startsWith("/uploads/")) {
      const uploadDir = getUploadDir();
      await mkdir(uploadDir, { recursive: true });
      await Promise.all([
        writeFile(path.join(uploadDir, filename), galleryBuf),
        writeFile(path.join(uploadDir, cardFilename), cardBuf),
      ]);
    }

    const url = galleryStored.url.startsWith("http")
      ? galleryStored.url
      : `/uploads/products/${filename}`;
    const cardUrl = cardStored.url.startsWith("http")
      ? cardStored.url
      : `/uploads/products/${cardFilename}`;

    return NextResponse.json({ url, cardUrl });
  } catch (error) {
    console.error("[seller/upload]", error);
    return NextResponse.json({ error: "Could not upload image." }, { status: 500 });
  }
}
