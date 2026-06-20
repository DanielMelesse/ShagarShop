import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import { requireSellerSession } from "@/lib/require-seller";
import { makeProductId, parseSellerProductInput } from "@/lib/seller";

export async function GET(request: Request) {
  const auth = await requireSellerSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const { session } = auth;

  const rows = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products: rows.map(toProduct) });
}

export async function POST(request: Request) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { session } = auth;

    const body = await request.json();
    const parsed = parseSellerProductInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data } = parsed;
    const product = await prisma.product.create({
      data: {
        id: makeProductId(data.name),
        sellerId: session.user.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        stock: data.stock,
        image: data.image,
        featured: data.featured ?? false,
        size: data.size,
      },
    });

    return NextResponse.json({ product: toProduct(product) }, { status: 201 });
  } catch (error) {
    console.error("[seller/products POST]", error);
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
