import { useTranslations } from "@/context/LocaleContext";
import { normalizeFulfillmentStatus } from "@/lib/order-status";

const LABEL_KEYS = {
  pending: "orderStatus.pending",
  shipped: "orderStatus.shipped",
  delivered: "orderStatus.delivered",
  cancelled: "orderStatus.cancelled",
} as const;

const HINT_KEYS = {
  pending: "orderStatus.pendingHint",
  shipped: "orderStatus.shippedHint",
  delivered: "orderStatus.deliveredHint",
  cancelled: "orderStatus.cancelledHint",
} as const;

export function useOrderStatusLabels() {
  const { t } = useTranslations();

  return {
    label: (status: string) => {
      const key = LABEL_KEYS[normalizeFulfillmentStatus(status)];
      return t(key);
    },
    hint: (status: string) => {
      const key = HINT_KEYS[normalizeFulfillmentStatus(status)];
      return t(key);
    },
  };
}
