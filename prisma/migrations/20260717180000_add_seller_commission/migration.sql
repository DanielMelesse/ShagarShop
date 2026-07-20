-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "sellerEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill: treat historical lines as promo (seller keeps full line total)
UPDATE "OrderItem"
SET "sellerEarnings" = ROUND(("priceAtPurchase" * "quantity")::numeric, 2)
WHERE "sellerEarnings" = 0;
