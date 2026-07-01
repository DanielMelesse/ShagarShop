import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthSession } from "@/lib/require-auth";

export async function PATCH(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const name = String(body.name ?? "").trim();
  const emailRaw = String(body.email ?? "").trim();
  const email = emailRaw ? emailRaw.toLowerCase() : null;

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Full name is required." }, { status: 400 });
  }
  if (email && !email.includes("@")) {
    return NextResponse.json({ error: "Email address is invalid." }, { status: 400 });
  }

  if (email) {
    const existingEmail = await prisma.user.findFirst({
      where: { email, NOT: { id: auth.session.user.id } },
    });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
  }

  const user = await prisma.user.update({
    where: { id: auth.session.user.id },
    data: { name, email },
    select: {
      id: true,
      name: true,
      phone: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    user: { ...user, createdAt: user.createdAt.toISOString() },
  });
}
