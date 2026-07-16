-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'DELIVERY';

-- CreateTable
CREATE TABLE "DeliveryProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "serviceArea" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeliveryProfile_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "deliveryId" TEXT,
ADD COLUMN "deliveryAssignedAt" TIMESTAMP(3),
ADD COLUMN "deliveredAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "DeliveryProfile_userId_key" ON "DeliveryProfile"("userId");

-- CreateIndex
CREATE INDEX "DeliveryProfile_serviceArea_idx" ON "DeliveryProfile"("serviceArea");

-- CreateIndex
CREATE INDEX "DeliveryProfile_active_idx" ON "DeliveryProfile"("active");

-- CreateIndex
CREATE INDEX "OrderItem_deliveryId_idx" ON "OrderItem"("deliveryId");

-- AddForeignKey
ALTER TABLE "DeliveryProfile" ADD CONSTRAINT "DeliveryProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
