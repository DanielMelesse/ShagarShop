"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { TrackingCodeScanner } from "@/components/TrackingCodeScanner";
import { FULFILLMENT_STATUS_STYLES } from "@/lib/seller-orders";
import {
  applyTrackingScan,
  lookupTrackingCode,
} from "@/lib/tracking-scan-client";
import type {
  TrackingScanAction,
  TrackingScanPackage,
} from "@/lib/tracking-scan";

interface TrackingScanPanelProps {
  title: string;
  description: string;
  roleHint: string;
}

export function TrackingScanPanel({
  title,
  description,
  roleHint,
}: TrackingScanPanelProps) {
  const [pkg, setPkg] = useState<TrackingScanPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyAction, setBusyAction] = useState<TrackingScanAction | null>(null);
  const [message, setMessage] = useState("");
  const [activeCode, setActiveCode] = useState("");

  async function handleLookup(code: string) {
    setLoading(true);
    setMessage("");
    setActiveCode(code);
    const result = await lookupTrackingCode(code);
    setLoading(false);
    if (!result.ok) {
      setPkg(null);
      setMessage(result.error);
      return;
    }
    setPkg(result.package);
  }

  async function handleAction(action: TrackingScanAction) {
    if (!activeCode) return;
    setBusyAction(action);
    setMessage("");
    const result = await applyTrackingScan(activeCode, action);
    setBusyAction(null);
    if (!result.ok) {
      setMessage(result.error);
      return;
    }
    setPkg(result.package);
    setMessage("Package status updated.");
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-zinc-900">{title}</h1>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
        <p className="mt-2 text-xs text-zinc-400">{roleHint}</p>
      </header>

      <TrackingCodeScanner onScan={(code) => void handleLookup(code)} disabled={loading} />

      {loading ? (
        <p className="text-center text-sm text-zinc-500">Looking up package…</p>
      ) : null}

      {message ? (
        <p
          className={`rounded-xl px-4 py-3 text-sm ${
            message.includes("updated")
              ? "border border-brand-200 bg-brand-50 text-brand-800"
              : "border border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {message}
        </p>
      ) : null}

      {pkg ? (
        <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="flex gap-4">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
              <ProductImage
                src={pkg.productImage}
                alt={pkg.productName}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-zinc-900">{pkg.productName}</p>
              <p className="mt-1 text-sm text-zinc-500">Qty {pkg.quantity}</p>
              <p className="mt-1 font-mono text-sm font-bold tracking-wide text-zinc-900">
                {pkg.trackingCode}
              </p>
              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${FULFILLMENT_STATUS_STYLES[pkg.fulfillmentStatus]}`}
              >
                {pkg.fulfillmentLabel}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-1 text-sm text-zinc-600">
            {pkg.shopName ? <p>Shop: {pkg.shopName}</p> : null}
            <p>Order #{pkg.orderRef}</p>
            <p>
              Ship to: {pkg.shippingName}, {pkg.address}, {pkg.city} {pkg.zip}
            </p>
            {pkg.deliveryAssigned ? (
              <p>Courier: {pkg.courierName ?? "Assigned"}</p>
            ) : (
              <p>Courier: not assigned yet</p>
            )}
          </div>

          {pkg.actions.length > 0 ? (
            <div className="mt-5 space-y-2">
              {pkg.actions.map((action) => (
                <button
                  key={action.action}
                  type="button"
                  disabled={busyAction !== null}
                  onClick={() => void handleAction(action.action)}
                  className="flex w-full flex-col rounded-xl bg-brand-600 px-4 py-3 text-left text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  <span className="text-sm font-semibold">
                    {busyAction === action.action ? "Updating…" : action.label}
                  </span>
                  {action.description ? (
                    <span className="mt-0.5 text-xs text-brand-100">
                      {action.description}
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-zinc-500">
              No actions available for this package in your role.
            </p>
          )}
        </article>
      ) : null}
    </div>
  );
}
