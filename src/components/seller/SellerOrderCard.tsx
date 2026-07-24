"use client";

import { useEffect, useState } from "react";
import { ProductImage } from "@/components/ProductImage";
import { BarcodeLabel } from "@/components/BarcodeLabel";
import { PackageBarcodeAssign } from "@/components/seller/PackageBarcodeAssign";
import { formatPrice } from "@/lib/products";
import {
  FULFILLMENT_STATUS_LABELS,
  FULFILLMENT_STATUS_STYLES,
  type FulfillmentStatus,
  type SellerOrderLine,
} from "@/lib/seller-orders";

interface SellerOrderCardProps {
  order: SellerOrderLine;
  onStatusChange?: (
    orderItemId: string,
    status: FulfillmentStatus,
    trackingCode?: string,
  ) => void;
  updatingId?: string | null;
  compact?: boolean;
}

function nextActions(status: FulfillmentStatus): { label: string; status: FulfillmentStatus }[] {
  if (status === "pending") {
    return [
      { label: "Ready for delivery", status: "shipped" },
      { label: "Cancel", status: "cancelled" },
    ];
  }
  if (status === "shipped") {
    return [{ label: "Cancel", status: "cancelled" }];
  }
  return [];
}

export function SellerOrderCard({
  order,
  onStatusChange,
  updatingId,
  compact = false,
}: SellerOrderCardProps) {
  const [assigningBarcode, setAssigningBarcode] = useState(false);
  const actions = onStatusChange ? nextActions(order.fulfillmentStatus) : [];
  const isUpdating = updatingId === order.id;

  useEffect(() => {
    if (order.fulfillmentStatus !== "pending" || order.trackingCode) {
      setAssigningBarcode(false);
    }
  }, [order.fulfillmentStatus, order.trackingCode]);

  function handleAction(status: FulfillmentStatus) {
    if (status === "shipped") {
      setAssigningBarcode(true);
      return;
    }
    onStatusChange?.(order.id, status);
  }

  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100">
            <ProductImage
              src={order.productImage}
              alt={order.productName}
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-zinc-900">{order.productName}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Qty {order.quantity} · {formatPrice(order.lineTotal)}
            </p>
            <p className="mt-1 text-sm text-zinc-700">
              You earn {formatPrice(order.sellerEarnings)}
              {order.commissionAmount > 0 ? (
                <span className="text-zinc-400">
                  {" "}
                  · fee {formatPrice(order.commissionAmount)} (
                  {Math.round(order.commissionRate * 100)}%)
                </span>
              ) : (
                <span className="text-brand-700"> · promo 0% fee</span>
              )}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Order #{order.orderId.slice(-8).toUpperCase()} ·{" "}
              {new Date(order.orderDate).toLocaleDateString("en-US", {
                dateStyle: "medium",
              })}
            </p>
            {order.trackingCode ? (
              <div className="mt-3">
                <BarcodeLabel value={order.trackingCode} label="Package barcode" />
              </div>
            ) : (
              <p className="mt-2 text-xs text-zinc-500">
                Package barcode is assigned when you mark this ready for delivery.
              </p>
            )}
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${FULFILLMENT_STATUS_STYLES[order.fulfillmentStatus]}`}
        >
          {FULFILLMENT_STATUS_LABELS[order.fulfillmentStatus]}
        </span>
      </div>

      {!compact && (
        <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
          <p className="font-medium text-zinc-800">Ship to</p>
          <p className="mt-1">
            {order.shippingName} · {order.address}, {order.city} {order.zip}
          </p>
        </div>
      )}

      {assigningBarcode ? (
        <PackageBarcodeAssign
          productName={order.productName}
          busy={isUpdating}
          onCancel={() => setAssigningBarcode(false)}
          onConfirm={(barcode) => {
            onStatusChange?.(order.id, "shipped", barcode);
          }}
        />
      ) : null}

      {!assigningBarcode && actions.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {actions.map((action) => (
            <button
              key={action.status}
              type="button"
              disabled={isUpdating}
              onClick={() => handleAction(action.status)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-60 ${
                action.status === "cancelled"
                  ? "border border-red-200 text-red-700 hover:bg-red-50"
                  : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {isUpdating ? "Updating…" : action.label}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}
