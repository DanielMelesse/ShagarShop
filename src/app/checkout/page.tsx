"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { EthiopiaShippingAddress } from "@/components/checkout/EthiopiaShippingAddress";
import { OrderSummary } from "@/components/OrderSummary";
import { useTranslations } from "@/context/LocaleContext";
import { useAuth } from "@/hooks/useAuth";
import { useCart, cartClientHeaders } from "@/context/CartContext";
import { openPaymentCheckout } from "@/lib/mobile-payment";
import { calculateOrderTotals, formatPrice, shippingLinesFromCart } from "@/lib/products";
import type { PaymentMethod } from "@/lib/payment";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useTranslations();
  const { user, isAuthenticated, isReady: authReady } = useAuth();
  const { items, subtotal, clearCart, isReady: cartReady } = useCart();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("telebirr");

  useEffect(() => {
    if (authReady && !isAuthenticated) {
      router.replace("/login?callbackUrl=/checkout");
    }
  }, [authReady, isAuthenticated, router]);

  if (!cartReady || !authReady) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="h-8 w-40 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 h-64 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-500">{t("checkout.redirectLogin")}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-zinc-500">{t("checkout.emptyCart")}</p>
        <Link href={TODAYS_DEALS_HREF} className="mt-4 inline-block text-brand-600 hover:underline">
          {t("checkout.goToShop")}
        </Link>
      </div>
    );
  }

  const { total } = calculateOrderTotals(subtotal, shippingLinesFromCart(items));
  const isOnline = paymentMethod === "telebirr" || paymentMethod === "chapa";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...cartClientHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
          })),
          shippingName: String(form.get("name") ?? ""),
          address: String(form.get("address") ?? ""),
          city: String(form.get("city") ?? ""),
          zip: String(form.get("zip") ?? ""),
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not place order.");
        setSubmitting(false);
        return;
      }

      const redirectUrl = data.payment?.checkoutUrl as string | undefined;
      if (isOnline && redirectUrl) {
        await openPaymentCheckout(redirectUrl);
        setSubmitting(false);
        return;
      }

      clearCart();
      router.push(`/checkout/result?orderId=${data.order.id}&method=cod`);
      router.refresh();
    } catch {
      setError("Could not place order.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">{t("checkout.title")}</h2>

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <EthiopiaShippingAddress defaultName={user?.name ?? ""} />

        <fieldset className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6">
          <legend className="px-1 text-sm font-semibold text-zinc-900">
            {t("checkout.paymentMethod")}
          </legend>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="paymentMethod"
              value="telebirr"
              checked={paymentMethod === "telebirr"}
              onChange={() => setPaymentMethod("telebirr")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900">
                {t("checkout.payWithTelebirr")}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {t("checkout.payWithTelebirrHint")}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="paymentMethod"
              value="chapa"
              checked={paymentMethod === "chapa"}
              onChange={() => setPaymentMethod("chapa")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900">
                {t("checkout.payWithChapa")}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {t("checkout.payWithChapaHint")}
              </span>
            </span>
          </label>

          <label className="flex cursor-pointer gap-3 rounded-xl border border-zinc-200 p-4 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50">
            <input
              type="radio"
              name="paymentMethod"
              value="cod"
              checked={paymentMethod === "cod"}
              onChange={() => setPaymentMethod("cod")}
              className="mt-1"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900">
                {t("checkout.payWithCod")}
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                {t("checkout.payWithCodHint")}
              </span>
            </span>
          </label>
        </fieldset>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="rounded-2xl bg-zinc-900 p-6 text-white">
          <p className="text-sm text-zinc-400">
            {items.length === 1
              ? t("common.item")
              : t("common.items", { count: items.length })}
          </p>
          <OrderSummary
            subtotal={subtotal}
            shippingLines={shippingLinesFromCart(items)}
            variant="dark"
            className="mt-4"
          />
          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold hover:bg-brand-500 disabled:opacity-60"
          >
            {submitting
              ? isOnline
                ? t("checkout.redirectingPayment")
                : t("checkout.placingOrder")
              : isOnline
                ? t("checkout.payNowWithTotal", { total: formatPrice(total) })
                : t("checkout.placeOrderWithTotal", { total: formatPrice(total) })}
          </button>
        </div>
      </form>
    </div>
  );
}
