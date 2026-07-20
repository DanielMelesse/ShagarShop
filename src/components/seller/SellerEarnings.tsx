"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SellerPageHeader } from "@/components/seller/SellerPageHeader";
import { SELLER_COMMISSION_RATE } from "@/lib/commission";
import { formatPrice } from "@/lib/products";
import { FULFILLMENT_STATUS_LABELS } from "@/lib/seller-orders";
import { fetchSellerEarnings } from "@/lib/seller-earnings-client";
import type { SellerEarningsSummary } from "@/lib/seller-earnings";
import { SELLER_ORDERS } from "@/lib/seller-routes";

function payoutBadge(status: "held" | "available" | "cancelled") {
  if (status === "available") {
    return "bg-brand-100 text-brand-800";
  }
  if (status === "held") {
    return "bg-amber-100 text-amber-800";
  }
  return "bg-zinc-100 text-zinc-600";
}

function payoutLabel(status: "held" | "available" | "cancelled") {
  if (status === "available") return "Available";
  if (status === "held") return "Held until delivered";
  return "Cancelled";
}

export function SellerEarnings() {
  const [earnings, setEarnings] = useState<SellerEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const result = await fetchSellerEarnings();
    if (!result.ok) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setEarnings(result.earnings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <SellerPageHeader
        title="Earnings"
        description="See what you’ve sold, fees, and what’s ready for payout."
      />

      {error && (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      {loading || !earnings ? (
        !error && <div className="mt-8 h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : (
        <>
          {earnings.inCommissionPromo ? (
            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-900">
              <p className="font-semibold">Launch promo: 0% commission</p>
              <p className="mt-1 text-brand-800">
                {earnings.promoDaysLeft} day
                {earnings.promoDaysLeft === 1 ? "" : "s"} left
                {earnings.promoEndsAt
                  ? ` (until ${new Date(earnings.promoEndsAt).toLocaleDateString(undefined, { dateStyle: "medium" })})`
                  : ""}
                . After that, ShegerShop takes{" "}
                {Math.round(SELLER_COMMISSION_RATE * 100)}% of product sales.
              </p>
            </div>
          ) : (
            <p className="mt-6 text-sm text-zinc-500">
              Platform fee: {Math.round(earnings.commissionRate * 100)}% of
              product sales. Delivery fees go to couriers, not sellers.
            </p>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Available for payout"
              value={formatPrice(earnings.availableForPayout)}
              hint={`${earnings.deliveredCount} delivered`}
              emphasize
            />
            <Metric
              label="Held until delivered"
              value={formatPrice(earnings.heldUntilDelivered)}
              hint={`${earnings.heldCount} in progress`}
            />
            <Metric
              label="Lifetime net"
              value={formatPrice(earnings.netEarnings)}
              hint={`Gross ${formatPrice(earnings.grossSales)}`}
            />
            <Metric
              label="Fees paid"
              value={formatPrice(earnings.commissionPaid)}
              hint={
                earnings.inCommissionPromo
                  ? "Promo 0%"
                  : `${Math.round(earnings.commissionRate * 100)}% platform`
              }
            />
          </div>

          <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            <p className="font-semibold text-zinc-900">How payouts work</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>
                Earnings stay <strong>held</strong> while you prepare or hand off
                to delivery.
              </li>
              <li>
                Once the order is <strong>delivered</strong>, the amount moves to{" "}
                <strong>available for payout</strong>.
              </li>
              <li>
                ShegerShop pays available earnings weekly (demo — no bank transfer
                yet).
              </li>
            </ul>
            <Link
              href={SELLER_ORDERS}
              className="mt-3 inline-block font-medium text-brand-700 hover:underline"
            >
              Fulfill orders →
            </Link>
          </div>

          <section className="mt-10">
            <h2 className="text-lg font-bold text-zinc-900">Recent sales</h2>
            {earnings.recentLines.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-10 text-center text-sm text-zinc-500">
                No sales yet. When buyers order your products, earnings show up
                here.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {earnings.recentLines.map((line) => (
                  <li
                    key={line.id}
                    className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-900">{line.productName}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        Qty {line.quantity} · Order #
                        {line.orderId.slice(-8).toUpperCase()} ·{" "}
                        {new Date(line.orderDate).toLocaleDateString(undefined, {
                          dateStyle: "medium",
                        })}
                      </p>
                      <p className="mt-1 text-xs text-zinc-400">
                        {FULFILLMENT_STATUS_LABELS[line.fulfillmentStatus]}
                        {line.commissionAmount > 0
                          ? ` · fee ${formatPrice(line.commissionAmount)} (${Math.round(line.commissionRate * 100)}%)`
                          : " · promo 0% fee"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900">
                        {formatPrice(line.sellerEarnings)}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${payoutBadge(line.payoutStatus)}`}
                      >
                        {payoutLabel(line.payoutStatus)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  emphasize,
}: {
  label: string;
  value: string;
  hint?: string;
  emphasize?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 shadow-sm ${
        emphasize
          ? "border-brand-200 bg-brand-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm text-zinc-500">{label}</p>
      <p
        className={`mt-2 text-2xl font-bold ${
          emphasize ? "text-brand-800" : "text-zinc-900"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
