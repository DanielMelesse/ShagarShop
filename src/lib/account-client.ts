import type { UserRole } from "@/lib/user-role";

export interface AccountUser {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
}

export interface AccountSellerProfile {
  shopName: string;
  location: string;
  category: string;
  licenseUrl: string;
  completedAt: string;
}

export interface AccountStats {
  orderCount: number;
  listingCount: number;
  pendingSellerOrders: number;
}

export interface AccountData {
  user: AccountUser;
  sellerProfile: AccountSellerProfile | null;
  stats: AccountStats;
}

export async function fetchAccount(): Promise<
  { ok: true; account: AccountData } | { ok: false; error: string }
> {
  const res = await fetch("/api/account", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not load account.",
    };
  }
  return { ok: true, account: data };
}

export async function updateAccountProfile(input: {
  name: string;
  email: string;
}): Promise<{ ok: true; user: AccountUser } | { ok: false; error: string }> {
  const res = await fetch("/api/account/profile", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not update profile.",
    };
  }
  return { ok: true, user: data.user };
}

export async function updateAccountPassword(input: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/account/password", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not update password.",
    };
  }
  return { ok: true };
}

export async function updateAccountShop(input: {
  shopName: string;
  location: string;
  category: string;
}): Promise<
  { ok: true; profile: AccountSellerProfile } | { ok: false; error: string }
> {
  const res = await fetch("/api/account/shop", {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not update shop.",
    };
  }
  return { ok: true, profile: data.profile };
}
