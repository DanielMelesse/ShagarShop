"use client";

import { TrackingCodeLabel } from "@/components/TrackingCodeLabel";
import { ProductImage } from "@/components/ProductImage";
import type { CourierDeliveryJob } from "@/lib/delivery";
import { formatPrice } from "@/lib/products";

interface DeliveryJobCardProps {
  job: CourierDeliveryJob;
  /** Primary action (e.g. Claim / Delivered). */
  actionLabel?: string;
  onAction?: () => void;
  /** Secondary action (e.g. Return). */
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  busy?: boolean;
}

function statusBadge(status: CourierDeliveryJob["fulfillmentStatus"]) {
  if (status === "delivered") {
    return {
      className: "bg-brand-100 text-brand-800",
      label: "Delivered",
    };
  }
  if (status === "returned") {
    return {
      className: "bg-orange-100 text-orange-800",
      label: "Returned",
    };
  }
  return {
    className: "bg-blue-100 text-blue-800",
    label: "On delivery",
  };
}

export function DeliveryJobCard({
  job,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  busy,
}: DeliveryJobCardProps) {
  const badge = statusBadge(job.fulfillmentStatus);
  const showActions =
    (actionLabel && onAction) || (secondaryActionLabel && onSecondaryAction);

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
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Order #{job.orderId.slice(-8).toUpperCase()}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${badge.className}`}
            >
              {badge.label}
            </span>
          </div>

          {job.items.length > 1 && (
            <ul className="mt-3 space-y-1 text-sm text-zinc-600">
              {job.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.productName}
                    <span className="ml-2 font-mono text-xs text-zinc-400">
                      {item.trackingCode}
                    </span>
                  </span>
                  <span className="shrink-0 text-zinc-400">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3">
            {job.trackingCode ? (
              <TrackingCodeLabel value={job.trackingCode} label="Tracking code" />
            ) : (
              <p className="text-xs text-zinc-500">No tracking code yet.</p>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <p className="font-medium text-zinc-800">Deliver to</p>
            <p className="mt-1">
              {job.shippingName}
              <br />
              {job.address}, {job.city} {job.zip}
            </p>
          </div>

          {showActions && (
            <div className="mt-4 flex flex-wrap gap-2">
              {actionLabel && onAction ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onAction}
                  className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? "Updating…" : actionLabel}
                </button>
              ) : null}
              {secondaryActionLabel && onSecondaryAction ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={onSecondaryAction}
                  className="rounded-xl border border-orange-300 bg-orange-50 px-4 py-2.5 text-sm font-semibold text-orange-800 transition hover:bg-orange-100 disabled:opacity-60"
                >
                  {busy ? "Updating…" : secondaryActionLabel}
                </button>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
