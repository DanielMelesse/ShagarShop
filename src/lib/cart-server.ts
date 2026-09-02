import { prisma } from "@/lib/db";
import { slimProductForCart, toProduct } from "@/lib/product-mapper";
import type { CartItem } from "@/lib/types";

export interface ServerCartLine {
  productId: string;
  quantity: number;
  selectedSize: string | null;
  product: ReturnType<typeof slimProductForCart>;
}

async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    create: { userId },
    update: {},
    include: {
      items: {
        include: { product: true },
        orderBy: { id: "asc" },
      },
    },
  });
}

function toCartLine(item: {
  productId: string;
  quantity: number;
  selectedSize: string | null;
  product: Parameters<typeof toProduct>[0];
}): ServerCartLine {
  return {
    productId: item.productId,
    quantity: item.quantity,
    selectedSize: item.selectedSize,
    product: slimProductForCart(toProduct(item.product)),
  };
}

export async function getUserCart(userId: string) {
  const cart = await getOrCreateCart(userId);
  const items = cart.items.map(toCartLine);
  const subtotal = items.reduce(
    (sum, line) => sum + line.product.price * line.quantity,
    0,
  );
  const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
  return { items, subtotal, itemCount };
}

export async function setCartItem(
  userId: string,
  productId: string,
  quantity: number,
  selectedSize?: string | null,
) {
  const cart = await getOrCreateCart(userId);
  const sizeKey = selectedSize ?? null;

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId, selectedSize: sizeKey },
    });
    return getUserCart(userId);
  }

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found.");

  const qty = Math.min(Math.max(1, quantity), product.stock);
  const existing = cart.items.find(
    (i) => i.productId === productId && i.selectedSize === sizeKey,
  );

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: qty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        quantity: qty,
        selectedSize: sizeKey,
      },
    });
  }

  await prisma.cart.update({
    where: { id: cart.id },
    data: { updatedAt: new Date() },
  });

  return getUserCart(userId);
}

export async function clearUserCart(userId: string) {
  const cart = await prisma.cart.findUnique({ where: { userId } });
  if (!cart) return getUserCart(userId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getUserCart(userId);
}

export async function mergeGuestCartIntoServer(
  userId: string,
  guestItems: CartItem[],
) {
  for (const line of guestItems) {
    await setCartItem(
      userId,
      line.product.id,
      line.quantity,
      line.selectedSize ?? null,
    );
  }
  return getUserCart(userId);
}
