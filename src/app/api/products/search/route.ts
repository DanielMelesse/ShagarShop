import { NextResponse } from "next/server";
import { isDepartmentSlug } from "@/lib/departments";
import { searchProductsDb } from "@/lib/products-server";
import type { SearchDepartment } from "@/lib/products";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const raw = searchParams.get("department") ?? "all";
  const department: SearchDepartment =
    raw === "all" || isDepartmentSlug(raw) ? (raw as SearchDepartment) : "all";
  const products = await searchProductsDb(q, 6, department);
  return NextResponse.json({ products });
}
