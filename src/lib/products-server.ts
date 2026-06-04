import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import type { Category, Product } from "@/lib/types";
import type { SearchDepartment } from "@/lib/products";

export async function getFeaturedProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { featured: true },
    orderBy: { name: "asc" },
  });
  return rows.map(toProduct);
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? toProduct(row) : null;
}

export async function filterProducts(options: {
  category?: Category;
  featured?: boolean;
  query?: string;
}): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: {
      ...(options.category ? { category: options.category } : {}),
      ...(options.featured ? { featured: true } : {}),
    },
    orderBy: options.featured
      ? [{ rating: "desc" }, { reviewCount: "desc" }]
      : { name: "asc" },
  });
  let products = rows.map(toProduct);
  if (options.query) {
    const q = options.query.toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    );
  }
  return products;
}

export async function searchProductsDb(
  query: string,
  limit = 6,
  department: SearchDepartment = "all",
): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  const rows = await prisma.product.findMany({
    where: department !== "all" ? { category: department } : {},
    orderBy: { name: "asc" },
  });

  return rows
    .map(toProduct)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q),
    )
    .slice(0, limit);
}
