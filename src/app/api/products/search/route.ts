import { NextResponse } from "next/server";
import { isCategory } from "@/lib/product-mapper";
import { searchProductsDb } from "@/lib/products-server";
import type { SearchDepartment } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const department = (searchParams.get("department") ?? "all") as SearchDepartment;
  const valid =
    department === "all" || isCategory(department) ? department : "all";
  const products = await searchProductsDb(q, 6, valid);
  return NextResponse.json({ products });
}
