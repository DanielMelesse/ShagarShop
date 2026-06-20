import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import { getDepartmentBySlug } from "@/lib/departments";
import { sortDeals } from "@/lib/deals";
import type { Category, Product } from "@/lib/types";
import type { SearchDepartment } from "@/lib/products";

const CATALOG_SECTION_LIMIT = 8;

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

export async function filterProductsByDepartment(slug: string): Promise<Product[]> {
  const department = getDepartmentBySlug(slug);
  if (!department) {
    return [];
  }

  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { category: slug },
        ...(department.productCategory ? [{ category: department.productCategory }] : []),
      ],
    },
    orderBy: { name: "asc" },
  });

  return rows.map(toProduct);
}

export async function getAllDepartmentsCatalog() {
  const [featuredRows, hotRows, bestSellerRows] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true, stock: { gt: 0 } },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
    }),
    prisma.product.findMany({
      where: {
        stock: { gt: 0 },
        OR: [{ featured: true }, { stock: { lte: 25 } }, { rating: { gte: 4.5 } }],
      },
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: CATALOG_SECTION_LIMIT * 2,
    }),
    prisma.product.findMany({
      where: { stock: { gt: 0 } },
      orderBy: [{ reviewCount: "desc" }, { rating: "desc" }],
      take: CATALOG_SECTION_LIMIT,
    }),
  ]);

  const bestDeals = sortDeals(featuredRows.map(toProduct)).slice(
    0,
    CATALOG_SECTION_LIMIT,
  );
  const hotItems = hotRows.map(toProduct).slice(0, CATALOG_SECTION_LIMIT);
  const bestSellers = bestSellerRows.map(toProduct);

  return { bestDeals, hotItems, bestSellers };
}

export async function searchProductsDb(
  query: string,
  limit = 6,
  department: SearchDepartment = "all",
): Promise<Product[]> {
  const q = query.trim().toLowerCase();
  if (!q) return [];

  if (department !== "all") {
    const dept = getDepartmentBySlug(department);
    const rows = await prisma.product.findMany({
      where: dept
        ? {
            OR: [
              { category: department },
              ...(dept.productCategory ? [{ category: dept.productCategory }] : []),
            ],
          }
        : { category: department },
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

  const rows = await prisma.product.findMany({
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
