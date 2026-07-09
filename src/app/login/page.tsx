"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { resolveAfterAuth, DEFAULT_AFTER_AUTH } from "@/lib/auth-redirect";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslations();
  const afterAuth = resolveAfterAuth(searchParams.get("callbackUrl"), null);
  const { login, user, isReady } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isReady && user) {
      router.replace(resolveAfterAuth(searchParams.get("callbackUrl"), user.role));
    }
  }, [isReady, user, router, searchParams]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const phone = String(form.get("phone") ?? "");
    const password = String(form.get("password") ?? "");
    const ok = await login(phone, password);
    setLoading(false);
    if (ok) {
      router.push(afterAuth);
    } else {
      setError(t("auth.invalidCredentials"));
    }
  }

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
        <Link
          href={
            afterAuth !== DEFAULT_AFTER_AUTH
              ? `/signup?callbackUrl=${encodeURIComponent(afterAuth)}`
              : "/signup"
          }
          className="font-medium text-brand-600 hover:underline"
        >
          {t("auth.signUp")}
        </Link>
      </p>
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
