export type SmsProviderName = "console" | "africastalking" | "twilio";

export interface SendSmsInput {
  to: string;
  body: string;
}

export interface SendSmsResult {
  ok: boolean;
  provider: SmsProviderName;
  skipped?: boolean;
  error?: string;
  messageId?: string;
}

export interface SmsProvider {
  name: SmsProviderName;
  send(input: SendSmsInput): Promise<SendSmsResult>;
}
