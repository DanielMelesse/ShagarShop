-- AlterTable
ALTER TABLE "Product" ADD COLUMN "sizeChart" TEXT;
ALTER TABLE "Product" ADD COLUMN "availableSizes" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Backfill from legacy single size
UPDATE "Product"
SET
  "sizeChart" = CASE
    WHEN "size" IN ('36','37','38','39','40','41','42','43','44','45','46') THEN 'shoes'
    WHEN "size" IN ('XS','S','M','L','XL','XXL') THEN 'clothing'
    WHEN "size" = 'One Size' THEN 'onesize'
    ELSE NULL
  END,
  "availableSizes" = CASE
    WHEN "size" IS NOT NULL AND "size" <> '' AND "size" <> 'All' THEN ARRAY["size"]
    ELSE ARRAY[]::TEXT[]
  END
WHERE "size" IS NOT NULL AND "size" <> '';
