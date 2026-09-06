import { GetObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { getS3Client, objectStorageEnabled } from "@/lib/object-storage";

export const runtime = "nodejs";

type Params = { params: Promise<{ key: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  if (!objectStorageEnabled()) {
    return NextResponse.json({ error: "Object storage not configured." }, { status: 404 });
  }

  const { key: parts } = await params;
  const key = parts.map(decodeURIComponent).join("/");
  if (!key || key.includes("..")) {
    return NextResponse.json({ error: "Invalid key." }, { status: 400 });
  }

  try {
    const result = await getS3Client().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET!.trim(),
        Key: key,
      }),
    );
    const bytes = await result.Body?.transformToByteArray();
    if (!bytes) {
      return NextResponse.json({ error: "Empty object." }, { status: 404 });
    }

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": result.ContentType || "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
}
