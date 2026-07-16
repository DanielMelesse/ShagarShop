"use client";

import { ProductImage } from "@/components/ProductImage";
import type { DeliveryJob } from "@/lib/delivery";
import { formatPrice } from "@/lib/products";

interface DeliveryJobCardProps {
  job: DeliveryJob;
  actionLabel?: string;
  onAction?: () => void;
  busy?: boolean;
}

export function DeliveryJobCard({
  job,
  actionLabel,
  onAction,
  busy,
}: DeliveryJobCardProps) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
          <ProductImage
            src={job.productImage}
            alt={job.productName}
            fill
            className="object-cover"
            sizes="64px"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-zinc-900">{job.productName}</p>
              <p className="mt-1 text-sm text-zinc-500">
                Qty {job.quantity} · {formatPrice(job.lineTotal)}
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Order #{job.orderId.slice(-8).toUpperCase()}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                job.fulfillmentStatus === "delivered"
                  ? "bg-brand-100 text-brand-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {job.fulfillmentStatus === "delivered" ? "Delivered" : "On delivery"}
            </span>
          </div>

          <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">Deliver to</p>
            <p className="mt-1">
              {job.shippingName}
              <br />
              {job.address}, {job.city} {job.zip}
            </p>
          </div>

          {actionLabel && onAction && (
            <button
              type="button"
              disabled={busy}
              onClick={onAction}
              className="mt-4 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Updating…" : actionLabel}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
