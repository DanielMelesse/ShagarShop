import { prisma } from "@/lib/db";
import { isSellerDepartmentSlug } from "@/lib/departments";
import { isValidLicensePath } from "@/lib/seller-license";

export interface SellerProfileInput {
  shopName: string;
  location: string;
  licenseUrl: string;
  category: string;
}

export function parseSellerProfileInput(
  body: Record<string, unknown>,
): { ok: true; data: SellerProfileInput } | { ok: false; error: string } {
  const shopName = String(body.shopName ?? "").trim();
  const location = String(body.location ?? "").trim();
  const licenseUrl = String(body.licenseUrl ?? "").trim();
  const category = String(body.category ?? "").trim();

  if (shopName.length < 2) {
    return { ok: false, error: "Shop name is required." };
  }
  if (location.length < 2) {
    return { ok: false, error: "Location is required." };
  }
  if (licenseUrl && !isValidLicensePath(licenseUrl)) {
    return { ok: false, error: "Upload a valid business license." };
  }
  if (!isSellerDepartmentSlug(category)) {
    return { ok: false, error: "Pick a valid department." };
  }

  return {
    ok: true,
    data: { shopName, location, licenseUrl, category },
  };
}

export async function getSellerProfileForUser(userId: string) {
  return prisma.sellerProfile.findUnique({ where: { userId } });
}

export async function hasCompletedSellerRegistration(userId: string): Promise<boolean> {
  const profile = await getSellerProfileForUser(userId);
  return profile !== null;
}

export function parseSellerProfileUpdate(
  body: Record<string, unknown>,
): { ok: true; data: Omit<SellerProfileInput, "licenseUrl"> } | { ok: false; error: string } {
  const shopName = String(body.shopName ?? "").trim();
  const location = String(body.location ?? "").trim();
  const category = String(body.category ?? "").trim();

  if (shopName.length < 2) {
    return { ok: false, error: "Shop name is required." };
  }
  if (location.length < 2) {
    return { ok: false, error: "Location is required." };
  }
  if (!isSellerDepartmentSlug(category)) {
    return { ok: false, error: "Pick a valid department." };
  }

  return {
    ok: true,
    data: { shopName, location, category },
  };
}
