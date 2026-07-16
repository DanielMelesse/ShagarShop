import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import {
  DELIVERY_VEHICLE_TYPES,
  isDeliveryVehicleType,
} from "@/lib/delivery";
import { isValidPhone, normalizePhone } from "@/lib/phone";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = normalizePhone(String(body.phone ?? ""));
    const password = String(body.password ?? "");
    const vehicleType = String(body.vehicleType ?? "").trim();
    const serviceArea = String(body.serviceArea ?? "").trim();

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
    if (!isDeliveryVehicleType(vehicleType)) {
      return NextResponse.json(
        {
          error: `Vehicle type must be one of: ${DELIVERY_VEHICLE_TYPES.join(", ")}.`,
        },
        { status: 400 },
      );
    }
    if (!serviceArea || serviceArea.length < 2) {
      return NextResponse.json(
        { error: "Service area (city / neighborhood) is required." },
        { status: 400 },
      );
    }

    const existingPhone = await prisma.user.findUnique({ where: { phone } });
    if (existingPhone) {
      return NextResponse.json(
        { error: "An account with this phone number already exists." },
        { status: 409 },
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
        phone,
        role: "DELIVERY",
        passwordHash: await bcrypt.hash(password, 10),
        deliveryProfile: {
          create: {
            vehicleType,
            serviceArea,
            active: true,
          },
        },
      },
      select: { id: true, name: true, phone: true, role: true },
    });

    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json(
      { error: "Could not create delivery account." },
      { status: 500 },
    );
  }
}
