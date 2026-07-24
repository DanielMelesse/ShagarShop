import type {
  FulfillmentStatus,
  SellerDashboardStats,
  SellerOrderLine,
} from "@/lib/seller-orders";

export async function fetchSellerOrders(): Promise<
  | { ok: true; stats: SellerDashboardStats; orders: SellerOrderLine[] }
  | { ok: false; error: string }
> {
  const res = await fetch("/api/seller/orders", { credentials: "same-origin" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not load orders.",
    };
  }
  return {
    ok: true,
    stats: data.stats,
    orders: data.orders ?? [],
  };
}

export async function updateSellerOrderStatus(
  orderItemId: string,
  fulfillmentStatus: FulfillmentStatus,
  trackingCode?: string,
): Promise<{ ok: true; order: SellerOrderLine } | { ok: false; error: string }> {
  const res = await fetch(`/api/seller/orders/${orderItemId}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fulfillmentStatus,
      ...(trackingCode ? { trackingCode } : {}),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      ok: false,
      error: typeof data.error === "string" ? data.error : "Could not update order.",
    };
  }
  return { ok: true, order: data.order };
}
