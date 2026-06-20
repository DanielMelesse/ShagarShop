"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useIsSeller } from "@/hooks/useIsSeller";
import { resolveAfterAuth } from "@/lib/auth-redirect";
import { parseSignupRole } from "@/lib/user-role";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signupRole = parseSignupRole(searchParams.get("role"));
  const afterAuth = resolveAfterAuth(
    searchParams.get("callbackUrl"),
    signupRole,
  );
  const { signup, user, isReady } = useAuth();
  const { isSeller } = useIsSeller();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (signupRole === "SELLER") {
      router.replace("/sell/register");
    }
  }, [signupRole, router]);

  useEffect(() => {
    if (signupRole === "SELLER") return;
    if (isReady && user) {
      router.replace(
        isSeller ? "/seller" : resolveAfterAuth(searchParams.get("callbackUrl"), user.role),
      );
    }
  }, [isReady, user, isSeller, router, searchParams, signupRole]);

  if (signupRole === "SELLER") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
      </div>
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "");
    const phone = String(form.get("phone") ?? "");
    const password = String(form.get("password") ?? "");
    const email = String(form.get("email") ?? "");
    const result = await signup(name, phone, password, email, signupRole);
    setLoading(false);
    if (result.ok) {
      router.push(afterAuth);
    } else {
      setError(result.error ?? "Could not create account.");
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">Create account</h2>
      <p className="mt-2 text-sm text-zinc-500">
        Join ShagarShop to track orders and checkout faster.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
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
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{" "}
        <Link
          href={
            afterAuth !== "/shop?featured=1"
              ? `/login?callbackUrl=${encodeURIComponent(afterAuth)}`
              : "/login"
          }
          className="font-medium text-brand-600 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}
