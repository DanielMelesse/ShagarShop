import { prisma } from "@/lib/db";
import { isCategory } from "@/lib/product-mapper";
import { isValidLicensePath } from "@/lib/seller-license";
import type { Category } from "@/lib/types";

export interface SellerProfileInput {
  shopName: string;
  location: string;
  licenseUrl: string;
  category: Category;
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
  if (!isValidLicensePath(licenseUrl)) {
    return { ok: false, error: "Upload a valid business license." };
  }
  if (!isCategory(category)) {
    return { ok: false, error: "Pick a valid shop category." };
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
