"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { resolveAfterAuth } from "@/lib/auth-redirect";
import {
  isSellLandingPath,
  isSellerAppPath,
  SELLER_HOME,
} from "@/lib/seller-routes";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const { t } = useTranslations();
  const { login, user, isReady } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Already signed in → leave /login (full navigation avoids client race).
  // Do not wait for submit `loading` — session can land while update() is slow.
  useEffect(() => {
    if (!isReady || !user) return;
    const dest = resolveAfterAuth(callbackUrl, user.role);
    if (window.location.pathname === "/login") {
      window.location.replace(dest);
    }
  }, [isReady, user, callbackUrl]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const phone = String(form.get("phone") ?? "");
    const password = String(form.get("password") ?? "");
    const result = await login(phone, password);
    if (!result.ok) {
      setLoading(false);
      setError(t("auth.invalidCredentials"));
      return;
    }

    // If session role timed out, still honor known role destinations from callback.
    const dest =
      result.role != null
        ? resolveAfterAuth(callbackUrl, result.role)
        : callbackUrl?.startsWith("/delivery")
          ? "/delivery"
          : isSellerAppPath(callbackUrl ?? "") ||
              isSellLandingPath(callbackUrl ?? "")
            ? SELLER_HOME
            : resolveAfterAuth(callbackUrl, "BUYER");
    // Hard navigation so role dashboards mount with a fresh session cookie.
    window.location.assign(dest);
  }

  const signupHref =
    callbackUrl &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//") &&
    !callbackUrl.startsWith("/delivery")
      ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : "/signup";

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">{t("auth.logIn")}</h2>
      <p className="mt-2 text-sm text-zinc-500">{t("auth.signInSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="phone" className="text-sm font-medium text-zinc-700">
            {t("auth.phoneNumber")}
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="09XX XXX XXXX"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-medium text-zinc-700">
            {t("auth.password")}
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? t("auth.signingIn") : t("auth.logIn")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        {t("auth.noAccountShort")}{" "}
        <Link href={signupHref} className="font-medium text-brand-600 hover:underline">
          {t("auth.signUp")}
        </Link>
      </p>
      {callbackUrl?.startsWith("/delivery") && (
        <p className="mt-3 text-center text-xs text-zinc-400">
          Couriers: use your delivery phone &amp; password. New partners register at{" "}
          <Link href="/deliver/register" className="text-brand-600 hover:underline">
            /deliver/register
          </Link>
          .
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="h-8 w-32 animate-pulse rounded-lg bg-zinc-200" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
