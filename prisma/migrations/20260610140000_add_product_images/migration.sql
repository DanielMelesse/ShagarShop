-- AlterTable
ALTER TABLE "Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Backfill existing cover image into images array
UPDATE "Product"
SET "images" = ARRAY["image"]
WHERE "image" <> '' AND cardinality("images") = 0;
