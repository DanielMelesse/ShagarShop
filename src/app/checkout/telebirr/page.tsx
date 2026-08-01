"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";

const POLL_MS = 3000;
const MAX_ATTEMPTS = 40; // ~2 minutes

function TelebirrPendingInner() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isReady: authReady } = useAuth();
  const { clearCart } = useCart();

  const txRef = searchParams.get("tx_ref") ?? searchParams.get("trx_ref") ?? "";
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);

  const verifyOnce = useCallback(async () => {
    if (!txRef) return false;
    const res = await fetch("/api/payments/telebirr/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ txRef, merchOrderId: txRef }),
    });
    const data = await res.json();
    if (res.ok && data.ok) {
      clearCart();
      router.replace(
        `/checkout/result?tx_ref=${encodeURIComponent(txRef)}&via=telebirr`,
      );
      return true;
    }
    return false;
  }, [txRef, clearCart, router]);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/login?callbackUrl=/checkout");
      return;
    }
    if (!txRef) {
      setError(t("checkout.paymentMissingRef"));
    }
  }, [authReady, isAuthenticated, router, txRef, t]);

  useEffect(() => {
    if (!authReady || !isAuthenticated || !txRef || error) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function tick(n: number) {
      if (cancelled) return;
      setAttempts(n);
      try {
        const paid = await verifyOnce();
        if (paid || cancelled) return;
      } catch {
        // keep polling; network blips are common while waiting on USSD
      }

      if (n >= MAX_ATTEMPTS) {
        setError(t("checkout.telebirrTimeout"));
        return;
      }
      timer = setTimeout(() => void tick(n + 1), POLL_MS);
    }

    void tick(1);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [authReady, isAuthenticated, txRef, error, verifyOnce, t]);

  if (!authReady) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl text-amber-500" aria-hidden>
          …
        </p>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900">
          {t("checkout.telebirrWaitingTitle")}
        </h2>
        <p className="mt-2 text-zinc-500">{error}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setError("");
              setAttempts(0);
            }}
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            {t("checkout.telebirrCheckAgain")}
          </button>
          <Link
            href="/checkout"
            className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800"
          >
            {t("checkout.tryAgain")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <div className="mx-auto h-12 w-12 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
      <h2 className="mt-6 text-2xl font-bold text-zinc-900">
        {t("checkout.telebirrWaitingTitle")}
      </h2>
      <p className="mt-2 text-zinc-500">{t("checkout.telebirrWaitingBody")}</p>
      <p className="mt-4 text-xs text-zinc-400">
        {t("checkout.telebirrWaitingHint", { count: attempts })}
      </p>
    </div>
  );
}

export default function TelebirrPendingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      }
    >
      <TelebirrPendingInner />
    </Suspense>
  );
}
