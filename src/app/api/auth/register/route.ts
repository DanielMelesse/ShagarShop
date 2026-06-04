import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    const password = String(body.password ?? "");
    const emailRaw = String(body.email ?? "").trim();
    const email = emailRaw ? emailRaw.toLowerCase() : null;

    if (!name || name.length < 2) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }
    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: "A valid phone number is required." },
        { status: 400 },
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 },
      );
    }
    if (email && !email.includes("@")) {
      return NextResponse.json({ error: "Email address is invalid." }, { status: 400 });
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 },
      );
    }

    if (email) {
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return NextResponse.json(
          { error: "An account with this email already exists." },
          { status: 409 },
        );
      }
    }

    await prisma.user.create({
      data: {
        name,
        phone,
        email,
        passwordHash: await bcrypt.hash(password, 10),
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Registration failed." }, { status: 500 });
  }
}
