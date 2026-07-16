import { toE164 } from "@/lib/phone";
import { resolveSmsProvider } from "./providers";
import type { SendSmsResult } from "./types";

export async function sendSms(toRaw: string, body: string): Promise<SendSmsResult> {
  const to = toE164(toRaw);
  if (!to) {
    return {
      ok: false,
      provider: resolveSmsProvider().name,
      skipped: true,
      error: "Invalid phone number for SMS.",
    };
  }

  if (process.env.SMS_ENABLED === "0") {
    return {
      ok: true,
      provider: resolveSmsProvider().name,
      skipped: true,
    };
  }

  try {
    return await resolveSmsProvider().send({ to, body });
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS send failed.";
    console.error("[sms] send failed:", message);
    return {
      ok: false,
      provider: resolveSmsProvider().name,
      error: message,
    };
  }
}
