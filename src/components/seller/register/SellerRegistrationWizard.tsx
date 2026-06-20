"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useIsSeller } from "@/hooks/useIsSeller";
import { categories } from "@/lib/products";
import type { Category } from "@/lib/types";
import { SELLER_HOME } from "@/lib/seller-routes";
import { SellerRegisterStepIndicator } from "@/components/seller/register/SellerRegisterStepIndicator";

const inputClass =
  "mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

interface AccountDraft {
  name: string;
  phone: string;
  password: string;
  email: string;
}

interface ShopDraft {
  shopName: string;
  location: string;
  category: Category;
  licenseUrl: string;
  licenseFileName: string;
}

export function SellerRegistrationWizard() {
  const router = useRouter();
  const { signup, user, isReady } = useAuth();
  const { isSeller, checkingSeller } = useIsSeller();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    if (!isReady || checkingSeller) return;

    if (user && !isSeller) {
      setCheckingProfile(false);
      setStep(1);
      return;
    }

    if (!user) {
      setCheckingProfile(false);
      setStep(1);
      return;
    }

    let cancelled = false;
    fetch("/api/seller/register/status", { credentials: "same-origin" })
      .then(async (res) => {
        if (cancelled) return;
        if (res.ok) {
          const data = await res.json();
          if (data.complete) {
            router.replace(SELLER_HOME);
            return;
          }
          if (data.profile?.shopName) setShopName(data.profile.shopName);
          setStep(2);
        } else if (res.status === 403) {
          setStep(1);
        }
        setCheckingProfile(false);
      })
      .catch(() => {
        if (!cancelled) setCheckingProfile(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isReady, checkingSeller, user, isSeller, router]);

  async function handleAccountStep(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const draft: AccountDraft = {
      name: String(form.get("name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      password: String(form.get("password") ?? ""),
      email: String(form.get("email") ?? "").trim(),
    };

    const result = await signup(
      draft.name,
      draft.phone,
      draft.password,
      draft.email,
      "SELLER",
    );
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Could not create account.");
      return;
    }

    setStep(2);
  }

  async function handleShopStep(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    const shopDraft: ShopDraft = {
      shopName: String(form.get("shopName") ?? "").trim(),
      location: String(form.get("location") ?? "").trim(),
      category: String(form.get("category") ?? "home") as Category,
      licenseUrl: String(form.get("licenseUrl") ?? "").trim(),
      licenseFileName: "",
    };

    const fileInput = e.currentTarget.elements.namedItem("license") as HTMLInputElement | null;
    const file = fileInput?.files?.[0];

    if (!shopDraft.licenseUrl && !file) {
      setError("Upload your business license to continue.");
      return;
    }

    setLoading(true);

    try {
      let licenseUrl = shopDraft.licenseUrl;

      if (file) {
        const body = new FormData();
        body.append("file", file);
        const uploadRes = await fetch("/api/seller/register/license", {
          method: "POST",
          credentials: "same-origin",
          body,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Could not upload license.");
          setLoading(false);
          return;
        }
        licenseUrl = uploadData.url;
      }

      const res = await fetch("/api/seller/register/profile", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: shopDraft.shopName,
          location: shopDraft.location,
          category: shopDraft.category,
          licenseUrl,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not save shop details.");
        setLoading(false);
        return;
      }

      setShopName(data.profile?.shopName ?? shopDraft.shopName);
      setStep(3);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!isReady || checkingSeller || checkingProfile) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (user && !isSeller && !checkingSeller) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-bold text-zinc-900">Shopper account detected</h2>
        <p className="mt-3 text-sm text-zinc-600">
          You&apos;re logged in as a shopper. Log out first, then register as a seller.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-block rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          Back to shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-brand-600">
          Seller registration
        </p>
        <h2 className="mt-2 text-2xl font-bold text-zinc-900">Join ShagarShop as a seller</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Complete all steps to open your shop and start listing products.
        </p>
      </div>

      <SellerRegisterStepIndicator currentStep={step} />

      {step === 1 && (
        <form onSubmit={handleAccountStep} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Step 1 — Your account</h3>
          <p className="text-sm text-zinc-500">
            Create login credentials for your seller account.
          </p>

          <div>
            <label htmlFor="name" className="text-sm font-medium text-zinc-700">
              Full name <span className="text-red-600">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
              Phone number <span className="text-red-600">*</span>
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="09XX XXX XXXX"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="password" className="text-sm font-medium text-zinc-700">
              Password <span className="text-red-600">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="email" className="text-sm font-medium text-zinc-700">
              Email <span className="font-normal text-zinc-400">(optional)</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Creating account…" : "Continue to shop details"}
          </button>

          <p className="text-center text-sm text-zinc-500">
            Already registered?{" "}
            <Link href="/login?callbackUrl=/sell/register" className="font-medium text-brand-600 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleShopStep} className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-zinc-900">Step 2 — Shop details</h3>
          <p className="text-sm text-zinc-500">
            Tell buyers about your business and upload your license.
          </p>

          <div>
            <label htmlFor="shopName" className="text-sm font-medium text-zinc-700">
              Shop name <span className="text-red-600">*</span>
            </label>
            <input
              id="shopName"
              name="shopName"
              type="text"
              required
              defaultValue={shopName}
              placeholder="e.g. Addis Crafts Co."
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="location" className="text-sm font-medium text-zinc-700">
              Location <span className="text-red-600">*</span>
            </label>
            <input
              id="location"
              name="location"
              type="text"
              required
              placeholder="City, area, or address"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="category" className="text-sm font-medium text-zinc-700">
              Primary category <span className="text-red-600">*</span>
            </label>
            <select id="category" name="category" required className={inputClass}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="license" className="text-sm font-medium text-zinc-700">
              Business license <span className="text-red-600">*</span>
            </label>
            <input type="hidden" name="licenseUrl" value="" />
            <input
              id="license"
              name="license"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              className="mt-1 block w-full text-sm text-zinc-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-700"
            />
            <p className="mt-1 text-xs text-zinc-500">PDF, JPEG, PNG, or WebP · max 10 MB</p>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? "Saving…" : "Complete registration"}
          </button>
        </form>
      )}

      {step === 3 && (
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-8 text-center shadow-sm">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-2xl text-white">
            ✓
          </span>
          <h3 className="mt-6 text-2xl font-bold text-zinc-900">Congratulations!</h3>
          <p className="mt-3 text-sm text-zinc-600">
            {shopName ? (
              <>
                <span className="font-semibold text-zinc-900">{shopName}</span> is registered on
                ShagarShop. You can now list products and reach buyers across Ethiopia.
              </>
            ) : (
              <>Your shop is registered. You can now list products and reach buyers.</>
            )}
          </p>
          <Link
            href={SELLER_HOME}
            className="mt-8 inline-block rounded-xl bg-brand-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            Go to seller dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
