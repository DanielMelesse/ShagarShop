import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { isValidPhone, normalizePhone } from "@/lib/phone";
import { resolveSessionRole } from "@/lib/session-role";
import type { UserRole } from "@/lib/user-role";

const ACCESS_TTL_SEC = 60 * 60; // 1 hour
const REFRESH_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

export interface MobileAuthUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
}

export interface MobileTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: MobileAuthUser;
}

function authSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET?.trim();
  if (!secret) throw new Error("NEXTAUTH_SECRET is not configured.");
  return new TextEncoder().encode(secret);
}

function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function signAccessToken(user: MobileAuthUser): Promise<string> {
  return new SignJWT({
    phone: user.phone,
    name: user.name,
    email: user.email,
    role: user.role,
    typ: "access",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SEC}s`)
    .sign(authSecret());
}

async function signRefreshToken(userId: string): Promise<string> {
  return new SignJWT({ typ: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SEC}s`)
    .sign(authSecret());
}

export async function verifyMobileAccessToken(
  token: string,
): Promise<MobileAuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.typ !== "access" || !payload.sub) return null;
    const role = await resolveSessionRole(
      payload.sub,
      payload.role as UserRole | undefined,
    );
    return {
      id: payload.sub,
      name: String(payload.name ?? ""),
      phone: String(payload.phone ?? ""),
      email: (payload.email as string | null) ?? null,
      role,
    };
  } catch {
    return null;
  }
}

async function verifyRefreshToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.typ !== "refresh" || !payload.sub) return null;
    const hash = hashRefreshToken(token);
    const stored = await prisma.mobileRefreshToken.findUnique({
      where: { tokenHash: hash },
      select: { userId: true, expiresAt: true },
    });
    if (!stored || stored.expiresAt < new Date()) return null;
    if (stored.userId !== payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

async function storeRefreshToken(userId: string, refreshToken: string) {
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SEC * 1000);
  await prisma.mobileRefreshToken.create({
    data: {
      userId,
      tokenHash: hashRefreshToken(refreshToken),
      expiresAt,
    },
  });
}

export async function loginWithPhonePassword(
  phoneRaw: string,
  password: string,
): Promise<MobileTokenPair | { error: string }> {
  const phone = normalizePhone(phoneRaw);
  if (!isValidPhone(phone)) {
    return { error: "Enter a valid Ethiopian phone number." };
  }

  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) return { error: "Invalid phone or password." };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return { error: "Invalid phone or password." };

  const role = await resolveSessionRole(user.id, user.role);
  const authUser: MobileAuthUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role,
  };

  const accessToken = await signAccessToken(authUser);
  const refreshToken = await signRefreshToken(user.id);
  await storeRefreshToken(user.id, refreshToken);

  return {
    accessToken,
    refreshToken,
    expiresIn: ACCESS_TTL_SEC,
    user: authUser,
  };
}

export async function refreshMobileTokens(
  refreshToken: string,
): Promise<MobileTokenPair | { error: string }> {
  const userId = await verifyRefreshToken(refreshToken);
  if (!userId) return { error: "Invalid or expired refresh token." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, email: true, role: true },
  });
  if (!user) return { error: "User not found." };

  const role = await resolveSessionRole(user.id, user.role);
  const authUser: MobileAuthUser = {
    id: user.id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role,
  };

  await prisma.mobileRefreshToken.deleteMany({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });

  const accessToken = await signAccessToken(authUser);
  const nextRefresh = await signRefreshToken(user.id);
  await storeRefreshToken(user.id, nextRefresh);

  return {
    accessToken,
    refreshToken: nextRefresh,
    expiresIn: ACCESS_TTL_SEC,
    user: authUser,
  };
}

export async function revokeRefreshToken(refreshToken: string) {
  await prisma.mobileRefreshToken.deleteMany({
    where: { tokenHash: hashRefreshToken(refreshToken) },
  });
}

export function generateDeviceId(): string {
  return randomBytes(16).toString("hex");
}
