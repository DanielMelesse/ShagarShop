import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { serializeProduct, toProduct } from "@/lib/product-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const row = await prisma.product.findUnique({
    where: { id },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          sellerProfile: { select: { shopName: true, location: true } },
        },
      },
    },
  });

  if (!row) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const product = serializeProduct(toProduct(row));

  return NextResponse.json({
    product,
    seller: row.seller
      ? {
          id: row.seller.id,
          name: row.seller.name,
          shopName: row.seller.sellerProfile?.shopName ?? null,
          location: row.seller.sellerProfile?.location ?? null,
        }
      : null,
  });
}
