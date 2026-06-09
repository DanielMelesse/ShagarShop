import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import type { Product } from "@/lib/types";

export async function getBestProduct(): Promise<Product | null> {
  const row = await prisma.product.findFirst({
    where: { stock: { gt: 0 } },
    orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
  });
  return row ? toProduct(row) : null;
}
