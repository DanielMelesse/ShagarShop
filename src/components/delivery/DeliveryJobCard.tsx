"use client";

import { ProductImage } from "@/components/ProductImage";
import type { CourierDeliveryJob } from "@/lib/delivery";
import { formatPrice } from "@/lib/products";

interface DeliveryJobCardProps {
  job: CourierDeliveryJob;
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
            variant="thumb"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-zinc-900">{job.productName}</p>
              <p className="mt-1 text-sm text-zinc-500">
                {job.itemCount > 1
                  ? `${job.itemCount} items · ${job.quantity} units`
                  : `Qty ${job.quantity}`}
              </p>
              <p className="mt-1 text-sm font-medium text-brand-700">
                Your pay {formatPrice(job.courierEarning)}
                {job.courierPayout.isBulk ? (
                  <span className="font-normal text-zinc-500">
                    {" "}
                    · bulk {formatPrice(job.courierPayout.bulkFirst)}
                    {job.courierPayout.extraCount > 0 && (
                      <>
                        {" "}
                        + {job.courierPayout.extraCount}×
                        {formatPrice(job.courierPayout.extraPerItem)}
                      </>
                    )}
                  </span>
                ) : null}
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

          {job.items.length > 1 && (
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              {job.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">{item.productName}</span>
                  <span className="shrink-0 text-zinc-400">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          )}

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
