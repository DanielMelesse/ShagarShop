import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import { makeProductId, parseSellerProductInput } from "@/lib/seller";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.product.findMany({
    where: { sellerId: session.user.id },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ products: rows.map(toProduct) });
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
  } catch {
    return NextResponse.json({ error: "Could not create product." }, { status: 500 });
  }
}
