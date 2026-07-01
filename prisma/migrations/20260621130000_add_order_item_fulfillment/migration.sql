ALTER TABLE "OrderItem" ADD COLUMN "fulfillmentStatus" TEXT NOT NULL DEFAULT 'pending';

CREATE INDEX "OrderItem_fulfillmentStatus_idx" ON "OrderItem"("fulfillmentStatus");
