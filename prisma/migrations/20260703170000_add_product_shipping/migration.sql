-- AlterTable
ALTER TABLE "Product" ADD COLUMN "shippingTier" TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE "Product" ADD COLUMN "extraShippingBirr" DOUBLE PRECISION NOT NULL DEFAULT 0;
