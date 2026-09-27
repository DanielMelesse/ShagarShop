"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { ProductImage } from "@/components/ProductImage";
import { useTranslations } from "@/context/LocaleContext";
import { useOrderStatusLabels } from "@/hooks/useOrderStatusLabels";
import { ACCOUNT_ORDERS } from "@/lib/account-routes";
import {
  deriveOrderFulfillmentStatus,
  getFulfillmentStatusStyle,
} from "@/lib/order-status";
import { paymentMethodLabel, paymentStatusLabel } from "@/lib/payment";
import { formatPrice } from "@/lib/products";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  fulfillmentStatus: string;
  trackingCode: string | null;
  deliveredAt: string | null;
  image: string | null;
}

interface OrderDetail {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paidAt: string | null;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  shippingName: string;
  address: string;
  city: string;
  zip: string;
  createdAt: string;
  items: OrderItem[];
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFulfillmentStatusStyle(status)}`}
    >
      {label}
    </span>
  );
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function AccountOrderDetail({ orderId }: { orderId: string }) {
  const { t } = useTranslations();
  const { label: statusLabel, hint: statusHint } = useOrderStatusLabels();
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/orders/${orderId}`, { credentials: "same-origin" })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setError(
            typeof data.error === "string"
              ? data.error
              : t("account.orderNotFound"),
          );
          return;
        }
        setOrder(data.order);
      })
      .catch(() => {
        if (!cancelled) setError(t("account.orderNotFound"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [orderId, t]);

  const orderStatus = order
    ? deriveOrderFulfillmentStatus(order.items)
    : "pending";
  const shortId = orderId.slice(-8).toUpperCase();

  return (
    <AccountShell
      title={
        order
          ? t("account.orderNumber", { id: shortId })
          : t("account.orderDetails")
      }
      description={t("account.orderDetailsDescription")}
    >
      <p className="mb-6">
        <Link
          href={ACCOUNT_ORDERS}
          className="text-sm font-medium text-brand-700 hover:underline"
        >
          {t("account.backToOrders")}
        </Link>
      </p>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-zinc-100" />
      ) : order ? (
        <div className="space-y-6">
          <section className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-zinc-900">
                  {t("account.orderNumber", { id: shortId })}
                </h2>
                <StatusBadge
                  status={orderStatus}
                  label={statusLabel(orderStatus)}
                />
              </div>
              <p className="mt-2 text-sm text-zinc-500">
                {t("account.placedOn", {
                  date: formatDateTime(order.createdAt),
                })}
              </p>
              <p className="mt-2 text-sm text-zinc-500">
                {statusHint(orderStatus)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-zinc-500">{t("account.total")}</p>
              <p className="text-2xl font-bold text-zinc-900">
                {formatPrice(order.total)}
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {t("account.items")}
            </h3>
            <ul className="mt-4 divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-start gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
                    {item.image ? (
                      <ProductImage
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">
                      {item.productName}
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {t("account.qty")}: {item.quantity} ·{" "}
                      {formatPrice(item.priceAtPurchase)} {t("account.each")}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusBadge
                        status={item.fulfillmentStatus}
                        label={statusLabel(item.fulfillmentStatus)}
                      />
                      {item.trackingCode ? (
                        <span className="rounded-lg bg-zinc-100 px-2 py-1 font-mono text-xs text-zinc-700">
                          {t("account.tracking", { code: item.trackingCode })}
                        </span>
                      ) : null}
                    </div>
                    {item.deliveredAt ? (
                      <p className="mt-1 text-xs text-zinc-500">
                        {t("account.deliveredOn", {
                          date: formatDateTime(item.deliveredAt),
                        })}
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 font-semibold text-zinc-900">
                    {formatPrice(item.priceAtPurchase * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {t("account.shippingAddress")}
              </h3>
              <p className="mt-3 text-sm font-medium text-zinc-900">
                {order.shippingName}
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {order.address}
                <br />
                {order.city} {order.zip}
              </p>
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
                {t("account.payment")}
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("account.paymentMethod")}</dt>
                  <dd className="text-right font-medium text-zinc-900">
                    {paymentMethodLabel(order.paymentMethod)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-zinc-500">{t("account.paymentStatus")}</dt>
                  <dd className="text-right font-medium text-zinc-900">
                    {paymentStatusLabel(order.paymentStatus)}
                  </dd>
                </div>
                {order.paidAt ? (
                  <div className="flex justify-between gap-3">
                    <dt className="text-zinc-500">{t("account.paidOn")}</dt>
                    <dd className="text-right text-zinc-700">
                      {formatDateTime(order.paidAt)}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>
          </div>

          <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              {t("account.orderSummary")}
            </h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-500">{t("account.subtotal")}</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-500">{t("account.shipping")}</dt>
                <dd>{formatPrice(order.shipping)}</dd>
              </div>
              {order.tax > 0 ? (
                <div className="flex justify-between">
                  <dt className="text-zinc-500">{t("account.tax")}</dt>
                  <dd>{formatPrice(order.tax)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold text-zinc-900">
                <dt>{t("account.total")}</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>
          </section>
        </div>
      ) : null}
    </AccountShell>
  );
}
