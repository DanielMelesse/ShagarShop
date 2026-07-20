#!/usr/bin/env bun
/**
 * Recompress existing product uploads to WebP + card thumbs (Ethiopia 3G).
 * Updates Product.image / Product.images paths in the database.
 *
 * Usage: bun scripts/recompress-product-images.ts
 */
import { readdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";

const UPLOAD_DIR = path.join(process.cwd(), "public/uploads/products");
const PUBLIC_PREFIX = "/uploads/products/";
const GALLERY_MAX_EDGE = 1200;
const CARD_MAX_EDGE = 400;
const WEBP_QUALITY = 75;

const IMAGE_EXT = /\.(jpe?g|png|gif|webp)$/i;

const prisma = new PrismaClient();

function isCardVariant(name: string): boolean {
  return name.includes("-card.");
}

function galleryWebpName(filename: string): string {
  const base = filename.replace(IMAGE_EXT, "");
  return `${base}.webp`;
}

function cardWebpName(filename: string): string {
  const base = filename.replace(IMAGE_EXT, "");
  return `${base}-card.webp`;
}

async function compressFile(filename: string): Promise<{
  oldPath: string;
  newPath: string;
  galleryBytes: number;
  cardBytes: number;
} | null> {
  if (isCardVariant(filename)) return null;
  if (!IMAGE_EXT.test(filename)) return null;

  const srcPath = path.join(UPLOAD_DIR, filename);
  const galleryName = galleryWebpName(filename);
  const cardName = cardWebpName(filename);
  const galleryPath = path.join(UPLOAD_DIR, galleryName);
  const cardPath = path.join(UPLOAD_DIR, cardName);

  // Already fully converted (same basename webp + card)
  if (
    filename.endsWith(".webp") &&
    galleryName === filename
  ) {
    // Ensure card exists
    try {
      const pipeline = sharp(srcPath, { animated: false }).rotate();
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
      await writeFile(cardPath, cardBuf);
      return {
        oldPath: `${PUBLIC_PREFIX}${filename}`,
        newPath: `${PUBLIC_PREFIX}${filename}`,
        galleryBytes: 0,
        cardBytes: cardBuf.length,
      };
    } catch (err) {
      console.error(`  skip card for ${filename}:`, err);
      return null;
    }
  }

  const pipeline = sharp(srcPath, { animated: false }).rotate();

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

  await writeFile(galleryPath, galleryBuf);
  await writeFile(cardPath, cardBuf);

  return {
    oldPath: `${PUBLIC_PREFIX}${filename}`,
    newPath: `${PUBLIC_PREFIX}${galleryName}`,
    galleryBytes: galleryBuf.length,
    cardBytes: cardBuf.length,
  };
}

function rewriteUrl(url: string, map: Map<string, string>): string {
  return map.get(url) ?? url;
}

async function main() {
  const files = await readdir(UPLOAD_DIR);
  const map = new Map<string, string>();
  let converted = 0;
  let bytesIn = 0;
  let bytesOut = 0;

  console.log(`Found ${files.length} files in ${UPLOAD_DIR}`);

  for (const filename of files) {
    if (isCardVariant(filename)) continue;

    const srcPath = path.join(UPLOAD_DIR, filename);
    try {
      const { size } = await import("fs/promises").then((fs) =>
        fs.stat(srcPath),
      );
      bytesIn += size;

      const result = await compressFile(filename);
      if (!result) continue;

      converted += 1;
      bytesOut += result.galleryBytes + result.cardBytes;
      if (result.oldPath !== result.newPath) {
        map.set(result.oldPath, result.newPath);
      }

      console.log(
        `✓ ${filename} → ${path.basename(result.newPath)} (+ card)  ${(result.galleryBytes / 1024).toFixed(0)}KB + ${(result.cardBytes / 1024).toFixed(0)}KB`,
      );

      // Remove original if we wrote a different gallery file
      if (result.oldPath !== result.newPath) {
        await unlink(srcPath);
      }
    } catch (err) {
      console.error(`✗ ${filename}:`, err);
    }
  }

  if (map.size > 0) {
    const products = await prisma.product.findMany({
      select: { id: true, image: true, images: true },
    });

    let updated = 0;
    for (const product of products) {
      const nextImage = rewriteUrl(product.image, map);
      const nextImages = product.images.map((u) => rewriteUrl(u, map));
      const changed =
        nextImage !== product.image ||
        nextImages.some((u, i) => u !== product.images[i]);

      if (!changed) continue;

      await prisma.product.update({
        where: { id: product.id },
        data: { image: nextImage, images: nextImages },
      });
      updated += 1;
    }
    console.log(`Updated ${updated} product row(s) in the database.`);
  } else {
    console.log("No path rewrites needed in the database.");
  }

  console.log(
    `\nDone. Converted ${converted} image(s). Approx input ${(bytesIn / 1024 / 1024).toFixed(1)}MB → gallery+card output tracked ${(bytesOut / 1024 / 1024).toFixed(1)}MB (new files only).`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
