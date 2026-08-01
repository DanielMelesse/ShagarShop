import { toE164 } from "@/lib/phone";

const CHAPA_BASE_URL = "https://api.chapa.co/v1";

export type ChapaMode = "live" | "mock";

export function getChapaMode(): ChapaMode {
  const forced = process.env.CHAPA_MODE?.trim().toLowerCase();
  if (forced === "mock") return "mock";
  if (forced === "live") return "live";
  const global = process.env.PAYMENT_MODE?.trim().toLowerCase();
  if (global === "mock") return "mock";
  if (global === "live") {
    return process.env.CHAPA_SECRET_KEY?.trim() ? "live" : "mock";
  }
  return process.env.CHAPA_SECRET_KEY?.trim() ? "live" : "mock";
}

export function getChapaSecretKey(): string | null {
  const key = process.env.CHAPA_SECRET_KEY?.trim();
  return key || null;
}

export function appBaseUrl(): string {
  const fromEnv =
    process.env.NEXTAUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** Chapa expects amount as a string with up to 2 decimals. */
export function formatChapaAmount(total: number): string {
  return (Math.round(total * 100) / 100).toFixed(2);
}

/** Local 09… / 9… → 09xxxxxxxx for Chapa. */
export function toChapaPhone(raw: string): string | null {
  const e164 = toE164(raw);
  if (!e164) return null;
  if (e164.startsWith("+251") && e164.length === 13) {
    return `0${e164.slice(4)}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return digits;
  if (digits.length === 9 && digits.startsWith("9")) return `0${digits}`;
  return null;
}

export function splitCustomerName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "Customer", lastName: "Sheger" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "Customer" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function chapaCustomerEmail(
  email: string | null | undefined,
  phone: string,
): string {
  const trimmed = email?.trim();
  if (trimmed && trimmed.includes("@")) return trimmed;
  const digits = phone.replace(/\D/g, "") || "guest";
  return `${digits}@customers.shegershop.et`;
}

export interface ChapaInitializeInput {
  amount: number;
  txRef: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  title?: string;
  description?: string;
}

export interface ChapaInitializeResult {
  checkoutUrl: string;
  mode: ChapaMode;
}

/** Chapa hosted checkout (banks, cards, wallets Chapa supports). */
export async function initializeChapaPayment(
  input: ChapaInitializeInput,
): Promise<ChapaInitializeResult> {
  const mode = getChapaMode();
  const base = appBaseUrl();
  const returnUrl = `${base}/checkout/result?tx_ref=${encodeURIComponent(input.txRef)}&via=chapa`;
  const callbackUrl = `${base}/api/payments/chapa/webhook`;

  if (mode === "mock") {
    return {
      mode: "mock",
      checkoutUrl: `${returnUrl}&mock=1`,
    };
  }

  const secret = getChapaSecretKey();
  if (!secret) {
    throw new Error("CHAPA_SECRET_KEY is not configured.");
  }

  const body: Record<string, unknown> = {
    amount: formatChapaAmount(input.amount),
    currency: "ETB",
    email: input.email,
    first_name: input.firstName,
    last_name: input.lastName,
    tx_ref: input.txRef,
    callback_url: callbackUrl,
    return_url: returnUrl,
    customization: {
      title: (input.title ?? "ShegerShop").slice(0, 16),
      description: (input.description ?? "Order payment").slice(0, 50),
    },
  };

  if (input.phone) {
    body.phone_number = input.phone;
  }

  const res = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    data?: { checkout_url?: string };
  };

  if (!res.ok || data.status !== "success" || !data.data?.checkout_url) {
    throw new Error(data.message ?? "Could not start Chapa payment.");
  }

  return { mode: "live", checkoutUrl: data.data.checkout_url };
}

export interface ChapaVerifyResult {
  success: boolean;
  status: string;
  amount: number | null;
  currency: string | null;
  txRef: string;
  paymentRef: string | null;
  raw: unknown;
}

export async function verifyChapaPayment(
  txRef: string,
): Promise<ChapaVerifyResult> {
  const mode = getChapaMode();

  if (mode === "mock") {
    return {
      success: true,
      status: "success",
      amount: null,
      currency: "ETB",
      txRef,
      paymentRef: `mock-chapa-${txRef}`,
      raw: { mode: "mock" },
    };
  }

  const secret = getChapaSecretKey();
  if (!secret) {
    throw new Error("CHAPA_SECRET_KEY is not configured.");
  }

  const res = await fetch(
    `${CHAPA_BASE_URL}/transaction/verify/${encodeURIComponent(txRef)}`,
    {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    },
  );

  const data = (await res.json()) as {
    status?: string;
    message?: string;
    data?: {
      status?: string;
      amount?: number | string;
      currency?: string;
      tx_ref?: string;
      reference?: string;
    };
  };

  const paymentStatus = String(data.data?.status ?? "").toLowerCase();
  const success =
    res.ok &&
    data.status === "success" &&
    (paymentStatus === "success" || paymentStatus === "successful");

  const amountRaw = data.data?.amount;
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : typeof amountRaw === "string"
        ? Number(amountRaw)
        : null;

  return {
    success,
    status: paymentStatus || String(data.status ?? "unknown"),
    amount: Number.isFinite(amount) ? amount : null,
    currency: data.data?.currency ?? null,
    txRef: data.data?.tx_ref ?? txRef,
    paymentRef: data.data?.reference ?? null,
    raw: data,
  };
}
