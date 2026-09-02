import { createHash, randomBytes } from "crypto";
import {
  Config,
  NotificationHandler,
  Telebirr,
  type OrderStatus,
} from "@melakudemeke/telebirr-js";
import { appBaseUrl } from "@/lib/chapa";

export type TelebirrMode = "live" | "mock";

function env(name: string): string | null {
  const value = process.env[name]?.trim();
  return value || null;
}

/** Normalize PEM / escaped newlines from .env files. */
export function normalizeTelebirrPrivateKey(raw: string): string {
  return raw.replace(/\\n/g, "\n").trim();
}

export function hasTelebirrCredentials(): boolean {
  return Boolean(
    env("TELEBIRR_FABRIC_APP_ID") &&
      env("TELEBIRR_APP_SECRET") &&
      env("TELEBIRR_MERCHANT_APP_ID") &&
      env("TELEBIRR_MERCHANT_CODE") &&
      env("TELEBIRR_PRIVATE_KEY"),
  );
}

export function getTelebirrMode(): TelebirrMode {
  const forced = process.env.TELEBIRR_MODE?.trim().toLowerCase();
  if (forced === "mock") return "mock";
  if (forced === "live") return "live";
  const global = process.env.PAYMENT_MODE?.trim().toLowerCase();
  if (global === "mock") return "mock";
  if (global === "live") return hasTelebirrCredentials() ? "live" : "mock";
  return hasTelebirrCredentials() ? "live" : "mock";
}

/** Telebirr merch_order_id must be ASCII letters/digits only. */
export function createTelebirrMerchOrderId(orderId: string): string {
  const clean = orderId.replace(/[^A-Za-z0-9]/g, "");
  const suffix = randomBytes(4).toString("hex");
  return `ss${clean}${suffix}`;
}

function telebirrEnvironment(): "test" | "production" {
  const raw =
    env("TELEBIRR_ENVIRONMENT")?.toLowerCase() ||
    env("TELEBIRR_ENV")?.toLowerCase();
  if (raw === "production" || raw === "prod" || raw === "live") {
    return "production";
  }
  return "test";
}

function buildTelebirrConfig() {
  if (!hasTelebirrCredentials()) {
    throw new Error(
      "Telebirr merchant credentials are missing. Set TELEBIRR_FABRIC_APP_ID, TELEBIRR_APP_SECRET, TELEBIRR_MERCHANT_APP_ID, TELEBIRR_MERCHANT_CODE, and TELEBIRR_PRIVATE_KEY.",
    );
  }

  const base = appBaseUrl();
  const notifyUrl =
    env("TELEBIRR_NOTIFY_URL") || `${base}/api/payments/telebirr/webhook`;
  const redirectUrl =
    env("TELEBIRR_REDIRECT_URL") || `${base}/checkout/result?via=telebirr`;

  const options = {
    fabricAppId: env("TELEBIRR_FABRIC_APP_ID")!,
    appSecret: env("TELEBIRR_APP_SECRET")!,
    merchantAppId: env("TELEBIRR_MERCHANT_APP_ID")!,
    merchantCode: env("TELEBIRR_MERCHANT_CODE")!,
    privateKey: normalizeTelebirrPrivateKey(env("TELEBIRR_PRIVATE_KEY")!),
    notifyUrl,
    redirectUrl,
    ...(env("TELEBIRR_PUBLIC_KEY")
      ? {
          telebirrPublicKey: normalizeTelebirrPrivateKey(
            env("TELEBIRR_PUBLIC_KEY")!,
          ),
        }
      : {}),
  };

  return telebirrEnvironment() === "production"
    ? Config.forProduction(options)
    : Config.forTest(options);
}

let cachedClient: Telebirr | null = null;

export function getTelebirrClient(): Telebirr {
  if (!cachedClient) {
    cachedClient = new Telebirr(buildTelebirrConfig());
  }
  return cachedClient;
}

export interface TelebirrCheckoutInput {
  /** Unique alphanumeric merchant order id (stored as paymentTxRef). */
  merchOrderId: string;
  title: string;
  amount: number;
  /** Override mock checkout return (mobile deep link). */
  returnUrl?: string;
}

export interface TelebirrCheckoutResult {
  mode: TelebirrMode;
  merchOrderId: string;
  checkoutUrl: string;
  prepayId: string | null;
}

export async function createTelebirrCheckout(
  input: TelebirrCheckoutInput,
): Promise<TelebirrCheckoutResult> {
  const mode = getTelebirrMode();
  const base = appBaseUrl();
  const amount = (Math.round(input.amount * 100) / 100).toFixed(2);

  if (mode === "mock") {
    const returnTarget =
      input.returnUrl ??
      `${base}/checkout/result?tx_ref=${encodeURIComponent(input.merchOrderId)}&mock=1&via=telebirr`;
    return {
      mode: "mock",
      merchOrderId: input.merchOrderId,
      prepayId: `mock-prepay-${input.merchOrderId}`,
      checkoutUrl: returnTarget,
    };
  }

  const client = getTelebirrClient();
  const result = await client.createCheckoutUrl(
    input.title.slice(0, 127),
    amount,
    input.merchOrderId,
  );

  return {
    mode: "live",
    merchOrderId: result.merchOrderId,
    checkoutUrl: result.checkoutUrl,
    prepayId: result.prepayId ?? null,
  };
}

export interface TelebirrVerifyResult {
  success: boolean;
  pending: boolean;
  status: string;
  amount: number | null;
  currency: string | null;
  merchOrderId: string;
  paymentRef: string | null;
  raw: unknown;
}

function mapOrderStatus(
  merchOrderId: string,
  status: OrderStatus,
): TelebirrVerifyResult {
  const amount =
    status.amount != null && status.amount !== ""
      ? Number(status.amount)
      : null;

  return {
    success: Boolean(status.paid),
    pending: !status.paid,
    status: status.tradeStatus || (status.paid ? "PAY_SUCCESS" : "PENDING"),
    amount: Number.isFinite(amount) ? amount : null,
    currency: status.currency ?? "ETB",
    merchOrderId,
    paymentRef: status.paymentOrderId ?? null,
    raw: status.raw ?? status,
  };
}

export async function verifyTelebirrPayment(
  merchOrderId: string,
): Promise<TelebirrVerifyResult> {
  const mode = getTelebirrMode();

  if (mode === "mock") {
    return {
      success: true,
      pending: false,
      status: "PAY_SUCCESS",
      amount: null,
      currency: "ETB",
      merchOrderId,
      paymentRef: `mock-telebirr-${merchOrderId}`,
      raw: { mode: "mock" },
    };
  }

  const client = getTelebirrClient();
  const status = await client.getOrderStatus(merchOrderId);
  return mapOrderStatus(merchOrderId, status);
}

/**
 * Parse Telebirr server notify payload. Returns merchant order id when valid.
 * In mock mode, accepts a simple JSON `{ merch_order_id }` for local tests.
 */
export function parseTelebirrNotify(body: unknown): {
  merchOrderId: string;
  paymentRef: string | null;
  isSuccess: boolean;
} {
  if (getTelebirrMode() === "mock") {
    const record = (body ?? {}) as Record<string, unknown>;
    const merchOrderId = String(
      record.merch_order_id ?? record.merchOrderId ?? record.tx_ref ?? "",
    ).trim();
    if (!merchOrderId) {
      throw new Error("Missing merch_order_id.");
    }
    return {
      merchOrderId,
      paymentRef:
        String(record.payment_order_id ?? record.paymentRef ?? "") || null,
      isSuccess: true,
    };
  }

  const config = buildTelebirrConfig();
  const notification =
    typeof body === "string"
      ? NotificationHandler.parse(body)
      : (body as Record<string, unknown>);

  if (!NotificationHandler.verify(notification, config)) {
    throw new Error("Invalid Telebirr notification signature.");
  }

  const info = NotificationHandler.extractPaymentInfo(notification);
  return {
    merchOrderId: info.merchantOrderId,
    paymentRef: info.paymentOrderId || null,
    isSuccess: NotificationHandler.isPaymentSuccessful(notification),
  };
}

export function telebirrNotifySuccessResponse() {
  return NotificationHandler.respondSuccess().toWebResponse();
}

export function telebirrNotifyErrorResponse(message: string, httpCode = 400) {
  return NotificationHandler.respondError(message, httpCode).toWebResponse();
}

/** Stable idempotency helper for notify retries. */
export function telebirrNotifyFingerprint(body: unknown): string {
  return createHash("sha256").update(JSON.stringify(body ?? {})).digest("hex");
}
