import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import {
  PRODUCT_LIST_SELECT,
  toProduct,
  toProductListItem,
} from "@/lib/product-mapper";
import { getDepartmentBySlug } from "@/lib/departments";
import { sortDeals } from "@/lib/deals";
import type { Category, Product, ProductListItem } from "@/lib/types";
import type { SearchDepartment } from "@/lib/products";
import { Prisma } from "@prisma/client";

const CATALOG_SECTION_LIMIT = 8;
export const SHOP_PAGE_SIZE = 24;

export async function getFeaturedProducts(): Promise<ProductListItem[]> {
  return getFeaturedProductsCached();
}

const getFeaturedProductsCached = unstable_cache(
  async () => {
    const rows = await prisma.product.findMany({
      where: { featured: true },
      select: PRODUCT_LIST_SELECT,
      orderBy: { name: "asc" },
    });
    return rows.map(toProductListItem);
  },
  ["featured-products"],
  { revalidate: 60 },
);

export async function getProductById(id: string): Promise<Product | null> {
  return getProductByIdCached(id);
}

const getProductByIdCached = unstable_cache(
  async (id: string) => {
    const row = await prisma.product.findUnique({ where: { id } });
    return row ? toProduct(row) : null;
  },
  ["product-by-id"],
  { revalidate: 60 },
);

export async function filterProducts(options: {
  category?: Category;
  featured?: boolean;
  query?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ products: ProductListItem[]; total: number; page: number; pageSize: number }> {
  const pageSize = options.pageSize ?? SHOP_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const q = options.query?.trim();

  const where: Prisma.ProductWhereInput = {
    ...(options.category ? { category: options.category } : {}),
    ...(options.featured ? { featured: true } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: PRODUCT_LIST_SELECT,
      orderBy: options.featured
        ? [{ rating: "desc" }, { reviewCount: "desc" }]
        : { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    products: rows.map(toProductListItem),
    total,
    page,
    pageSize,
  };
}

/** Featured deals for home/hero — capped, no pagination UI. */
export async function getDealsProducts(limit = 48): Promise<ProductListItem[]> {
  return getDealsProductsCached(limit);
}

const getDealsProductsCached = unstable_cache(
  async (limit: number) => {
    const rows = await prisma.product.findMany({
      where: { featured: true },
      select: PRODUCT_LIST_SELECT,
      orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
      take: limit,
    });
    return rows.map(toProductListItem);
  },
  ["deals-products"],
  { revalidate: 60 },
);

export async function filterProductsByDepartment(
  slug: string,
  options?: { page?: number; pageSize?: number },
): Promise<{ products: ProductListItem[]; total: number; page: number; pageSize: number }> {
  const department = getDepartmentBySlug(slug);
  const pageSize = options?.pageSize ?? SHOP_PAGE_SIZE;
  const page = Math.max(1, options?.page ?? 1);

  if (!department) {
    return { products: [], total: 0, page, pageSize };
  }

  const where: Prisma.ProductWhereInput = {
    OR: [
      { category: slug },
      ...(department.productCategory ? [{ category: department.productCategory }] : []),
    ],
  };

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      select: PRODUCT_LIST_SELECT,
      orderBy: { name: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return {
    products: rows.map(toProductListItem),
    total,
    page,
    pageSize,
  };
}

export async function getAllDepartmentsCatalog() {
  return getAllDepartmentsCatalogCached();
}

const getAllDepartmentsCatalogCached = unstable_cache(
  async () => {
    const [featuredRows, hotRows, bestSellerRows] = await Promise.all([
      prisma.product.findMany({
        where: { featured: true, stock: { gt: 0 } },
        select: PRODUCT_LIST_SELECT,
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: CATALOG_SECTION_LIMIT * 2,
      }),
      prisma.product.findMany({
        where: {
          stock: { gt: 0 },
          OR: [{ featured: true }, { stock: { lte: 25 } }, { rating: { gte: 4.5 } }],
        },
        select: PRODUCT_LIST_SELECT,
        orderBy: [{ rating: "desc" }, { reviewCount: "desc" }],
        take: CATALOG_SECTION_LIMIT * 2,
      }),
      prisma.product.findMany({
        where: { stock: { gt: 0 } },
        select: PRODUCT_LIST_SELECT,
        orderBy: [{ reviewCount: "desc" }, { rating: "desc" }],
        take: CATALOG_SECTION_LIMIT,
      }),
    ]);

    const bestDeals = sortDeals(featuredRows.map(toProductListItem)).slice(
      0,
      CATALOG_SECTION_LIMIT,
    );
    const hotItems = hotRows.map(toProductListItem).slice(0, CATALOG_SECTION_LIMIT);
    const bestSellers = bestSellerRows.map(toProductListItem);

    return { bestDeals, hotItems, bestSellers };
  },
  ["departments-catalog"],
  { revalidate: 60 },
);

export async function searchProductsDb(
  query: string,
  limit = 6,
  department: SearchDepartment = "all",
): Promise<ProductListItem[]> {
  const q = query.trim();
  if (!q) return [];

  const textFilter: Prisma.ProductWhereInput = {
    OR: [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
    ],
  };

  let where: Prisma.ProductWhereInput = textFilter;

  if (department !== "all") {
    const dept = getDepartmentBySlug(department);
    where = {
      AND: [
        textFilter,
        dept
          ? {
              OR: [
                { category: department },
                ...(dept.productCategory
                  ? [{ category: dept.productCategory }]
                  : []),
              ],
            }
          : { category: department },
      ],
    };
  }

  const rows = await prisma.product.findMany({
    where,
    select: PRODUCT_LIST_SELECT,
    orderBy: { name: "asc" },
    take: limit,
  });

  return rows.map(toProductListItem);
}
