"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { getSellerDepartmentOptions, legacyCategoryToDepartmentSlug } from "@/lib/departments";
import { fetchAccount, updateAccountShop } from "@/lib/account-client";
import { SELL_LANDING, SELLER_HOME } from "@/lib/seller-routes";

export function AccountShopSettings() {
  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [licenseUrl, setLicenseUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notSeller, setNotSeller] = useState(false);

  const departments = getSellerDepartmentOptions();

  const load = useCallback(async () => {
    const result = await fetchAccount();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }

    if (result.account.user.role !== "SELLER") {
      setNotSeller(true);
      setLoading(false);
      return;
    }

    if (!result.account.sellerProfile) {
      setError("Complete seller registration to manage shop settings.");
      setLoading(false);
      return;
    }

    setShopName(result.account.sellerProfile.shopName);
    setLocation(result.account.sellerProfile.location);
    setCategory(legacyCategoryToDepartmentSlug(result.account.sellerProfile.category));
    setLicenseUrl(result.account.sellerProfile.licenseUrl);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const result = await updateAccountShop({ shopName, location, category });
    setSaving(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage("Shop settings saved.");
  }

  if (loading) {
    return (
      <AccountShell title="Shop settings">
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </AccountShell>
    );
  }

  if (notSeller) {
    return (
      <AccountShell title="Shop settings">
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center">
          <p className="text-zinc-600">Shop settings are only available for seller accounts.</p>
          <Link
            href={SELL_LANDING}
            className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            Learn about selling on ShegerShop →
          </Link>
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      title="Shop settings"
      description="Update your public shop details shown to buyers."
    >
      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Shop name</span>
            <input
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Location</span>
            <input
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, area, or address"
              className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-zinc-700">Primary category</span>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm"
            >
              {departments.map((dept) => (
                <option key={dept.value} value={dept.value}>
                  {dept.label}
                </option>
              ))}
            </select>
          </label>

          {licenseUrl && (
            <div className="rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              <p className="font-medium text-zinc-800">Business license</p>
              <p className="mt-1 break-all text-xs">{licenseUrl}</p>
              <p className="mt-2 text-xs text-zinc-400">
                To replace your license, contact support or re-register.
              </p>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        {message && <p className="mt-4 text-sm text-brand-700">{message}</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save shop settings"}
          </button>
          <Link
            href={SELLER_HOME}
            className="rounded-xl border border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Seller dashboard
          </Link>
        </div>
      </form>
    </AccountShell>
  );
}
