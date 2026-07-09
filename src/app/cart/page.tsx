"use client";

import { OrderSummary } from "@/components/OrderSummary";
import { ProductImage } from "@/components/ProductImage";
import Link from "next/link";
import { useTranslations } from "@/context/LocaleContext";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useMounted } from "@/hooks/useMounted";
import { formatPrice, shippingLinesFromCart } from "@/lib/products";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

export default function CartPage() {
  const { t } = useTranslations();
  const mounted = useMounted();
  const { isAuthenticated, isReady: authReady } = useAuth();
  const { items, itemCount, subtotal, updateQuantity, removeItem, isReady } =
    useCart();

  const showOrderSummary = mounted && authReady && isAuthenticated;

  if (!isReady || !authReady) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
        <div className="mt-8 h-40 animate-pulse rounded-2xl bg-zinc-100" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <p className="text-5xl" aria-hidden>
          🛒
        </p>
        <h2 className="mt-4 text-2xl font-bold text-zinc-900">{t("cart.empty")}</h2>
        <p className="mt-2 text-zinc-500">{t("cart.emptyHint")}</p>
        <Link
          href={TODAYS_DEALS_HREF}
          className="mt-8 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <h2 className="text-2xl font-bold text-zinc-900">
        {itemCount === 1
          ? t("cart.titleOne")
          : t("cart.title", { count: itemCount })}
      </h2>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <ul className="space-y-4 lg:col-span-2">
          {items.map(({ product, quantity, selectedSize }) => (
            <li
              key={`${product.id}-${selectedSize ?? ""}`}
              className="flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4"
            >
              <Link
                href={`/product/${product.id}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-zinc-100"
              >
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <Link
                  href={`/product/${product.id}`}
                  className="font-medium text-zinc-900 hover:text-brand-600"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm font-semibold text-zinc-900">
                  {formatPrice(product.price)}
                </p>
                {selectedSize && (
                  <p className="mt-1 text-sm text-zinc-500">
                    {t("cart.size", { size: selectedSize })}
                  </p>
                )}
                <div className="mt-auto flex items-center gap-3 pt-3">
                  <label className="flex items-center gap-2 text-sm text-zinc-600">
                    {t("cart.qty")}
                    <select
                      value={quantity}
                      onChange={(e) =>
                        updateQuantity(
                          product.id,
                          Number(e.target.value),
                          selectedSize,
                        )
                      }
                      className="rounded border border-zinc-300 px-2 py-1"
                    >
                      {Array.from(
                        { length: Math.min(product.stock, 10) },
                        (_, i) => i + 1,
                      ).map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => removeItem(product.id, selectedSize)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    {t("cart.remove")}
                  </button>
                </div>
              </div>
              <p className="shrink-0 font-semibold text-zinc-900">
                {formatPrice(product.price * quantity)}
              </p>
            </li>
          ))}
        </ul>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6">
          {showOrderSummary ? (
            <>
              <h2 className="font-semibold text-zinc-900">{t("cart.orderSummary")}</h2>
              <OrderSummary
                subtotal={subtotal}
                shippingLines={shippingLinesFromCart(items)}
                className="mt-4"
              />
              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                {t("cart.proceedCheckout")}
              </Link>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-zinc-900">{t("cart.checkout")}</h2>
              <p className="mt-2 text-sm text-zinc-500">{t("cart.signInHint")}</p>
              <Link
                href="/login?callbackUrl=/cart"
                className="mt-6 block w-full rounded-xl bg-brand-600 py-3 text-center text-sm font-semibold text-white hover:bg-brand-700"
              >
                {t("cart.logInCheckout")}
              </Link>
              <Link
                href="/signup?callbackUrl=/cart"
                className="mt-3 block w-full rounded-xl border border-zinc-300 py-3 text-center text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
              >
                {t("cart.createAccountCheckout")}
              </Link>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
