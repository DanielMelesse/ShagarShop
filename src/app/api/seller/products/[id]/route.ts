import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { toProduct } from "@/lib/product-mapper";
import { requireSellerSession } from "@/lib/require-seller";
import { parseSellerProductUpdate } from "@/lib/seller";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getOwnedProduct(userId: string, productId: string) {
  return prisma.product.findFirst({
    where: { id: productId, sellerId: userId },
  });
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { session } = auth;

    const { id } = await context.params;
    const existing = await getOwnedProduct(session.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({ product: toProduct(existing) });
  } catch {
    return NextResponse.json({ error: "Could not load product." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { session } = auth;

    const { id } = await context.params;
    const existing = await getOwnedProduct(session.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = parseSellerProductUpdate(body, {
      category: existing.category,
      size: existing.size,
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ product: toProduct(product) });
  } catch {
    return NextResponse.json({ error: "Could not update product." }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const auth = await requireSellerSession(request);
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const { session } = auth;

    const { id } = await context.params;
    const existing = await getOwnedProduct(session.user.id, id);
    if (!existing) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const orderCount = await prisma.orderItem.count({ where: { productId: id } });
    if (orderCount > 0) {
      return NextResponse.json(
        {
          error:
            "This product has been ordered and cannot be deleted. Set stock to 0 instead.",
        },
        { status: 409 },
      );
    }

    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not delete product." }, { status: 500 });
  }
}
