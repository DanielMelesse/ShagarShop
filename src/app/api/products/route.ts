import { NextResponse } from "next/server";
import { getDepartmentBySlug } from "@/lib/departments";
import {
  MOBILE_PRODUCT_PAGE_SIZE,
  serializeProductListItem,
} from "@/lib/product-api";
import {
  filterProducts,
  filterProductsByDepartment,
  getDealsProducts,
  getFeaturedProducts,
} from "@/lib/products-server";
import { isCategory } from "@/lib/product-mapper";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const pageSize = Math.min(
    48,
    Math.max(1, Number(searchParams.get("pageSize") ?? MOBILE_PRODUCT_PAGE_SIZE) || MOBILE_PRODUCT_PAGE_SIZE),
  );
  const query = searchParams.get("q") ?? undefined;
  const categoryRaw = searchParams.get("category") ?? undefined;
  const department = searchParams.get("department") ?? undefined;
  const featured = searchParams.get("featured") === "1";
  const section = searchParams.get("section") ?? undefined;

  if (section === "featured") {
    const products = (await getFeaturedProducts()).map(serializeProductListItem);
    return NextResponse.json({ products, total: products.length, page: 1, pageSize: products.length });
  }

  if (section === "deals") {
    const products = (await getDealsProducts(48)).map(serializeProductListItem);
    return NextResponse.json({ products, total: products.length, page: 1, pageSize: products.length });
  }

  if (department) {
    const result = await filterProductsByDepartment(department, { page, pageSize });
    if (!getDepartmentBySlug(department)) {
      return NextResponse.json({ error: "Department not found." }, { status: 404 });
    }
    return NextResponse.json({
      ...result,
      products: result.products.map(serializeProductListItem),
    });
  }

  const category = categoryRaw && isCategory(categoryRaw) ? categoryRaw : undefined;
  const result = await filterProducts({
    category,
    featured,
    query,
    page,
    pageSize,
  });

  return NextResponse.json({
    ...result,
    products: result.products.map(serializeProductListItem),
  });
}
