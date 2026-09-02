import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthSession } from "@/lib/require-auth";

export async function POST(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  const platform = String(body.platform ?? "unknown").trim();

  if (!token) {
    return NextResponse.json({ error: "token is required." }, { status: 400 });
  }

  await prisma.pushDevice.upsert({
    where: { token },
    create: {
      userId: auth.session.user.id,
      token,
      platform,
    },
    update: {
      userId: auth.session.user.id,
      platform,
      updatedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const token = String(body.token ?? "").trim();
  if (token) {
    await prisma.pushDevice.deleteMany({
      where: { token, userId: auth.session.user.id },
    });
  }

  return NextResponse.json({ ok: true });
}
