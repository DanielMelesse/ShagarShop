-- Real payment fields for Chapa / COD checkout.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT NOT NULL DEFAULT 'paid';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT NOT NULL DEFAULT 'demo';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentTxRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRef" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Order_paymentTxRef_key" ON "Order"("paymentTxRef");
CREATE INDEX IF NOT EXISTS "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "Order_status_idx" ON "Order"("status");
