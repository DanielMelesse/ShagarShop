import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { appBaseUrl } from "@/lib/chapa";

export interface StoredObject {
  url: string;
  key: string;
}

function objectStorageEnabled(): boolean {
  return Boolean(
    process.env.S3_BUCKET?.trim() &&
      process.env.S3_ACCESS_KEY_ID?.trim() &&
      process.env.S3_SECRET_ACCESS_KEY?.trim(),
  );
}

function s3Client(): S3Client {
  const config: S3ClientConfig = {
    region: process.env.S3_REGION?.trim() || "auto",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!.trim(),
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!.trim(),
    },
  };
  const endpoint = process.env.S3_ENDPOINT?.trim();
  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = process.env.S3_FORCE_PATH_STYLE === "true";
  }
  return new S3Client(config);
}

function publicObjectUrl(key: string): string {
  // Always proxy through the app so private Railway buckets remain readable.
  // Set S3_PUBLIC_URL only when the bucket is truly public (e.g. Cloudflare R2 CDN).
  const publicBase = process.env.S3_PUBLIC_URL?.trim();
  const useDirectPublic =
    process.env.S3_PUBLIC_DIRECT === "true" && Boolean(publicBase);
  if (useDirectPublic && publicBase) {
    return `${publicBase.replace(/\/$/, "")}/${key}`;
  }

  const proxyBase = appBaseUrl();
  return `${proxyBase}/api/uploads/object/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
}

/** Upload bytes to S3/R2 when configured, otherwise local public/uploads. */
export async function storeObject(params: {
  key: string;
  body: Buffer;
  contentType: string;
  localSubdir?: string;
}): Promise<StoredObject> {
  if (objectStorageEnabled()) {
    await s3Client().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: params.key,
        Body: params.body,
        ContentType: params.contentType,
      }),
    );
    return { key: params.key, url: publicObjectUrl(params.key) };
  }

  const subdir = params.localSubdir ?? "misc";
  const localDir = path.join(process.cwd(), "public", "uploads", subdir);
  await mkdir(localDir, { recursive: true });
  const filename = path.basename(params.key);
  await writeFile(path.join(localDir, filename), params.body);
  return {
    key: params.key,
    url: `/uploads/${subdir}/${filename}`,
  };
}

export function getS3Client(): S3Client {
  return s3Client();
}

export { objectStorageEnabled };
