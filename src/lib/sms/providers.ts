import type { SendSmsInput, SendSmsResult, SmsProvider, SmsProviderName } from "./types";

function consoleProvider(): SmsProvider {
  return {
    name: "console",
    async send({ to, body }: SendSmsInput): Promise<SendSmsResult> {
      console.info(`[sms:console] to=${to} body=${JSON.stringify(body)}`);
      return { ok: true, provider: "console", messageId: `console-${Date.now()}` };
    },
  };
}

function africastalkingProvider(): SmsProvider {
  const username = process.env.AFRICASTALKING_USERNAME?.trim() ?? "";
  const apiKey = process.env.AFRICASTALKING_API_KEY?.trim() ?? "";
  const from = process.env.AFRICASTALKING_FROM?.trim() || undefined;
  const sandbox = process.env.AFRICASTALKING_SANDBOX === "1";

  return {
    name: "africastalking",
    async send({ to, body }: SendSmsInput): Promise<SendSmsResult> {
      if (!username || !apiKey) {
        return {
          ok: false,
          provider: "africastalking",
          error: "Missing AFRICASTALKING_USERNAME or AFRICASTALKING_API_KEY.",
        };
      }

      const endpoint = sandbox
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging";

      const params = new URLSearchParams({
        username,
        to,
        message: body,
      });
      if (from) {
        params.set("from", from);
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          apiKey,
        },
        body: params.toString(),
      });

      const data = (await res.json().catch(() => null)) as {
        SMSMessageData?: {
          Recipients?: { statusCode?: number; messageId?: string; status?: string }[];
        };
        errorMessage?: string;
      } | null;

      if (!res.ok) {
        return {
          ok: false,
          provider: "africastalking",
          error: data?.errorMessage ?? `Africa's Talking HTTP ${res.status}`,
        };
      }

      const recipient = data?.SMSMessageData?.Recipients?.[0];
      const statusCode = recipient?.statusCode ?? 0;
      // 101 = Success, 102 = Sent to network (accepted)
      if (statusCode !== 101 && statusCode !== 102) {
        return {
          ok: false,
          provider: "africastalking",
          error: recipient?.status ?? "SMS not accepted by Africa's Talking",
        };
      }

      return {
        ok: true,
        provider: "africastalking",
        messageId: recipient?.messageId,
      };
    },
  };
}

function twilioProvider(): SmsProvider {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim() ?? "";
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim() ?? "";
  const from = process.env.TWILIO_FROM?.trim() ?? "";

  return {
    name: "twilio",
    async send({ to, body }: SendSmsInput): Promise<SendSmsResult> {
      if (!accountSid || !authToken || !from) {
        return {
          ok: false,
          provider: "twilio",
          error: "Missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM.",
        };
      }

      const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const params = new URLSearchParams({ To: to, From: from, Body: body });
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const data = (await res.json().catch(() => null)) as {
        sid?: string;
        message?: string;
        error_message?: string;
      } | null;

      if (!res.ok) {
        return {
          ok: false,
          provider: "twilio",
          error: data?.message ?? data?.error_message ?? `Twilio HTTP ${res.status}`,
        };
      }

      return { ok: true, provider: "twilio", messageId: data?.sid };
    },
  };
}

export function resolveSmsProvider(): SmsProvider {
  const name = (process.env.SMS_PROVIDER?.trim().toLowerCase() || "console") as SmsProviderName;

  if (name === "africastalking") return africastalkingProvider();
  if (name === "twilio") return twilioProvider();
  return consoleProvider();
}
