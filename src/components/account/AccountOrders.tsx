"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountShell } from "@/components/account/AccountShell";
import { useTranslations } from "@/context/LocaleContext";
import {
  deriveOrderFulfillmentStatus,
  getFulfillmentStatusStyle,
} from "@/lib/order-status";
import { useOrderStatusLabels } from "@/hooks/useOrderStatusLabels";
import { accountOrderPath } from "@/lib/account-routes";
import { formatPrice } from "@/lib/products";
import { TODAYS_DEALS_HREF } from "@/lib/shop-routes";

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  priceAtPurchase: number;
  fulfillmentStatus: string;
}

interface Order {
  id: string;
  status: string;
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

function OrderStatusBadge({
  status,
  label,
}: {
  status: string;
  label: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFulfillmentStatusStyle(status)}`}
    >
      {label}
    </span>
  );
}

export function AccountOrders() {
  const { t } = useTranslations();
  const { label: statusLabel, hint: statusHint } = useOrderStatusLabels();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders", { credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.orders) setOrders(data.orders);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <AccountShell
      title={t("account.ordersTitle")}
      description={t("account.ordersDescription")}
    >
      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-zinc-100" />
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
          <p className="text-zinc-500">{t("account.noOrders")}</p>
          <Link
            href={TODAYS_DEALS_HREF}
            className="mt-4 inline-block rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white"
          >
            {t("account.startShopping")}
          </Link>
        </div>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => {
            const orderStatus = deriveOrderFulfillmentStatus(order.items);
            const itemCount = order.items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            const previewNames = order.items
              .slice(0, 2)
              .map((item) => item.productName)
              .join(", ");
            const moreCount = Math.max(0, order.items.length - 2);

            return (
              <li key={order.id}>
                <Link
                  href={accountOrderPath(order.id)}
                  className="block rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:border-brand-300 hover:shadow-md"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-zinc-500">
                        {new Date(order.createdAt).toLocaleDateString(
                          undefined,
                          {
                            dateStyle: "medium",
                          },
                        )}
                      </p>
                      <p className="mt-1 font-semibold text-zinc-900">
                        {t("account.orderNumber", {
                          id: order.id.slice(-8).toUpperCase(),
                        })}
                      </p>
                      <div className="mt-2">
                        <OrderStatusBadge
                          status={orderStatus}
                          label={statusLabel(orderStatus)}
                        />
                      </div>
                      <p className="mt-2 text-sm text-zinc-500">
                        {statusHint(orderStatus)}
                      </p>
                      <p className="mt-2 text-sm text-zinc-600">
                        {previewNames}
                        {moreCount > 0 ? ` +${moreCount}` : ""} ·{" "}
                        {itemCount === 1
                          ? t("common.item")
                          : t("common.items", { count: itemCount })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-zinc-900">
                        {formatPrice(order.total)}
                      </p>
                      <p className="mt-2 text-sm font-medium text-brand-600">
                        {t("account.viewDetails")} →
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AccountShell>
  );
}
