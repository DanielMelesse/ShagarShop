-- Package tracking barcode: assigned by seller when item is ready for courier pickup.
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "trackingCode" TEXT;

-- Allow null until seller assigns at "Ready for delivery".
ALTER TABLE "OrderItem" ALTER COLUMN "trackingCode" DROP NOT NULL;

-- Drop product barcode if an earlier draft migration added it.
ALTER TABLE "Product" DROP COLUMN IF EXISTS "barcode";

DROP INDEX IF EXISTS "Product_barcode_key";
DROP INDEX IF EXISTS "OrderItem_trackingCode_key";
DROP INDEX IF EXISTS "OrderItem_trackingCode_idx";

CREATE UNIQUE INDEX "OrderItem_trackingCode_key" ON "OrderItem"("trackingCode");
CREATE INDEX "OrderItem_trackingCode_idx" ON "OrderItem"("trackingCode");
