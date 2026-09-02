import { NextResponse } from "next/server";
import {
  clearUserCart,
  getUserCart,
  mergeGuestCartIntoServer,
  setCartItem,
} from "@/lib/cart-server";
import { requireAuthSession } from "@/lib/require-auth";
import type { CartItem } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const cart = await getUserCart(auth.session.user.id);
  return NextResponse.json(cart);
}

export async function POST(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await request.json().catch(() => ({}));
  const action = String(body.action ?? "set");

  if (action === "merge") {
    const guestItems = Array.isArray(body.items) ? (body.items as CartItem[]) : [];
    const cart = await mergeGuestCartIntoServer(
      auth.session.user.id,
      guestItems,
    );
    return NextResponse.json(cart);
  }

  if (action === "clear") {
    const cart = await clearUserCart(auth.session.user.id);
    return NextResponse.json(cart);
  }

  const productId = String(body.productId ?? "");
  const quantity = Number(body.quantity ?? 1);
  const selectedSize =
    typeof body.selectedSize === "string" ? body.selectedSize : null;

  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  try {
    const cart = await setCartItem(
      auth.session.user.id,
      productId,
      quantity,
      selectedSize,
    );
    return NextResponse.json(cart);
  } catch {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }
}

export async function DELETE(request: Request) {
  const auth = await requireAuthSession(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const cart = await clearUserCart(auth.session.user.id);
  return NextResponse.json(cart);
}
