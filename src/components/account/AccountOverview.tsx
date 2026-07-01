"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { fetchAccount, type AccountData } from "@/lib/account-client";
import {
  ACCOUNT_ORDERS,
  ACCOUNT_PROFILE,
  ACCOUNT_SHOP,
} from "@/lib/account-routes";
import { isSellerRole } from "@/lib/user-role";
import { SELLER_HOME, SELLER_ORDERS } from "@/lib/seller-routes";

function roleLabel(role: string) {
  return role === "SELLER" ? "Seller account" : "Shopper account";
}

export function AccountOverview() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await fetchAccount();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setAccount(result.account);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isSeller = account ? isSellerRole(account.user.role) : false;

  return (
    <AccountShell
      title="Overview"
      description="Manage your profile, orders, and shop settings."
    >
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : account ? (
        <div className="space-y-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-semibold text-zinc-900">{account.user.name}</p>
                <p className="mt-1 text-sm text-zinc-500">
                  {account.user.phone}
                  {account.user.email ? ` · ${account.user.email}` : ""}
                </p>
                <p className="mt-2 text-xs text-zinc-400">
                  Member since{" "}
                  {new Date(account.user.createdAt).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isSeller ? "bg-brand-100 text-brand-800" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {roleLabel(account.user.role)}
              </span>
            </div>

            {isSeller && account.sellerProfile && (
              <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
                <p className="font-medium text-zinc-800">{account.sellerProfile.shopName}</p>
                <p className="mt-1">{account.sellerProfile.location}</p>
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href={ACCOUNT_ORDERS}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <p className="text-sm text-zinc-500">Your orders</p>
              <p className="mt-1 text-2xl font-bold text-zinc-900">
                {account.stats.orderCount}
              </p>
              <p className="mt-2 text-sm text-brand-600">View order history →</p>
            </Link>

            <Link
              href={ACCOUNT_PROFILE}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
            >
              <p className="text-sm text-zinc-500">Profile & security</p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">Edit details</p>
              <p className="mt-2 text-sm text-brand-600">Name, email, password →</p>
            </Link>

            {isSeller && (
              <>
                <Link
                  href={SELLER_HOME}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <p className="text-sm text-zinc-500">Listings</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {account.stats.listingCount}
                  </p>
                  <p className="mt-2 text-sm text-brand-600">Seller dashboard →</p>
                </Link>

                <Link
                  href={SELLER_ORDERS}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <p className="text-sm text-zinc-500">Orders to fulfill</p>
                  <p className="mt-1 text-2xl font-bold text-zinc-900">
                    {account.stats.pendingSellerOrders}
                  </p>
                  <p className="mt-2 text-sm text-brand-600">Manage seller orders →</p>
                </Link>

                <Link
                  href={ACCOUNT_SHOP}
                  className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-brand-300 hover:shadow-md sm:col-span-2"
                >
                  <p className="text-sm text-zinc-500">Shop settings</p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">
                    {account.sellerProfile?.shopName ?? "Update shop profile"}
                  </p>
                  <p className="mt-2 text-sm text-brand-600">Shop name, location, category →</p>
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </AccountShell>
  );
}
