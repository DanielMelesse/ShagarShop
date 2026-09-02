"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/products";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";
import { mobileFetch } from "@/lib/mobile-auth-client";
import { closePaymentBrowser } from "@/lib/mobile-payment";

function CheckoutResultInner() {
  const { t } = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isReady: authReady } = useAuth();
  const { clearCart } = useCart();

  const txRef = searchParams.get("tx_ref") ?? searchParams.get("trx_ref") ?? "";
  const merchOrderId =
    searchParams.get("merch_order_id") ??
    searchParams.get("merchantOrderId") ??
    "";
  const orderIdParam = searchParams.get("orderId") ?? "";
  const method = searchParams.get("method") ?? "";
  const via = searchParams.get("via") ?? method;
  const isMock = searchParams.get("mock") === "1";
  const paymentRef = (merchOrderId || txRef).trim();
  const verifyPath =
    via === "telebirr" || method === "telebirr"
      ? "/api/payments/telebirr/verify"
      : "/api/payments/chapa/verify";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    method === "cod" && orderIdParam ? "success" : "loading",
  );
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState(orderIdParam);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace("/login?callbackUrl=/checkout");
      return;
    }

    if (method === "cod" && orderIdParam) {
      clearCart();
      setStatus("success");
      return;
    }

    if (!paymentRef) {
      setError(t("checkout.paymentMissingRef"));
      setStatus("error");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await mobileFetch(verifyPath, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            txRef: paymentRef,
            merchOrderId: paymentRef,
            mock: isMock,
          }),
        });
        const data = await res.json();
        if (cancelled) return;

        if (!res.ok) {
          setError(data.error ?? t("checkout.paymentFailed"));
          setStatus("error");
          return;
        }

        await closePaymentBrowser();

        clearCart();
        setOrderId(data.orderId ?? "");
        setTotal(typeof data.total === "number" ? data.total : null);
        setStatus("success");
        router.refresh();
      } catch {
        if (!cancelled) {
          setError(t("checkout.paymentFailed"));
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    authReady,
    isAuthenticated,
    paymentRef,
    verifyPath,
    method,
    orderIdParam,
    isMock,
    clearCart,
    router,
    t,
  ]);

  if (!authReady || status === "loading") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        <p className="mt-4 text-zinc-500">{t("checkout.confirmingPayment")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-5xl text-red-500" aria-hidden>
          !
        </p>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900">
          {t("checkout.paymentFailedTitle")}
        </h2>
        <p className="mt-2 text-zinc-500">{error}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/checkout"
            className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            {t("checkout.tryAgain")}
          </Link>
          <Link
            href="/cart"
            className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800"
          >
            {t("checkout.backToCart")}
          </Link>
        </div>
      </div>
    );
  }

  const thankYouKey =
    method === "cod" ? "checkout.thankYouCod" : "checkout.thankYouPaid";

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="text-5xl" aria-hidden>
        ✓
      </p>
      <h2 className="mt-4 text-2xl font-bold text-zinc-900">
        {t("checkout.orderPlaced")}
      </h2>
      <p className="mt-2 text-zinc-500">
        {t(thankYouKey, { name: user ? `, ${user.name}` : "" })}
      </p>
      {total != null && (
        <p className="mt-2 text-sm font-medium text-zinc-700">
          {t("checkout.amountPaid", { total: formatPrice(total) })}
        </p>
      )}
      {orderId && (
        <p className="mt-1 text-xs text-zinc-400">
          {t("checkout.orderRef", { id: orderId.slice(0, 10) })}
        </p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/account/orders"
          className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
        >
          {t("checkout.viewOrders")}
        </Link>
        <Link
          href={TODAYS_DEALS_HREF}
          className="rounded-xl border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-800"
        >
          {t("checkout.continueShopping")}
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutResultPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      }
    >
      <CheckoutResultInner />
    </Suspense>
  );
}
