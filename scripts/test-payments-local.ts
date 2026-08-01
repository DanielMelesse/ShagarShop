/**
 * Local mock tests for Chapa + Telebirr merchant payment flows.
 *
 * Usage:
 *   bun scripts/test-payments-local.ts
 *
 * Forces mock mode (no live keys required). Creates draft orders, runs
 * provider initialize/verify, finalizes payment, then cleans up.
 */
process.env.PAYMENT_MODE = "mock";
process.env.CHAPA_MODE = "mock";
process.env.TELEBIRR_MODE = "mock";
// Ensure live keys (if present) cannot override mock for this run.
delete process.env.CHAPA_SECRET_KEY;

import bcrypt from "bcryptjs";
import {
  getChapaMode,
  initializeChapaPayment,
  verifyChapaPayment,
} from "../src/lib/chapa";
import { prisma } from "../src/lib/db";
import { finalizeOnlinePaidOrder } from "../src/lib/order-payment";
import {
  createTelebirrCheckout,
  createTelebirrMerchOrderId,
  getTelebirrMode,
  parseTelebirrNotify,
  verifyTelebirrPayment,
} from "../src/lib/telebirr";

const PASS = "✓";
const FAIL = "✗";

let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ${PASS} ${message}`);
  } else {
    failed += 1;
    console.error(`  ${FAIL} ${message}`);
  }
}

async function ensureBuyer() {
  const phone = "0911999001";
  const passwordHash = await bcrypt.hash("buyer123", 10);
  return prisma.user.upsert({
    where: { phone },
    update: { role: "BUYER", name: "Payment Test Buyer" },
    create: {
      phone,
      name: "Payment Test Buyer",
      role: "BUYER",
      passwordHash,
    },
  });
}

async function ensureProduct() {
  const existing = await prisma.product.findFirst({
    where: { stock: { gte: 2 } },
    orderBy: { price: "asc" },
  });
  if (existing) return existing;

  return prisma.product.create({
    data: {
      id: `pay-test-${Date.now()}`,
      name: "Payment Test Item",
      description: "Temporary product for payment mock tests",
      price: 100,
      category: "electronics",
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400",
      stock: 10,
      featured: false,
    },
  });
}

async function testChapaMock(buyerId: string, productId: string, price: number) {
  console.log("\n=== Chapa merchant API (mock) ===");
  assert(getChapaMode() === "mock", `mode is mock (got ${getChapaMode()})`);

  const order = await prisma.order.create({
    data: {
      userId: buyerId,
      status: "awaiting_payment",
      paymentStatus: "pending",
      paymentMethod: "chapa",
      subtotal: price,
      shipping: 200,
      tax: 0,
      total: price + 200,
      shippingName: "Payment Tester",
      address: "Bole Road",
      city: "Addis Ababa",
      zip: "1000",
      items: {
        create: [
          {
            productId,
            quantity: 1,
            priceAtPurchase: price,
            productName: "Payment Test Item",
          },
        ],
      },
    },
  });

  const txRef = `ss-chapa-test-${order.id.slice(-8)}`;
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentTxRef: txRef },
  });

  const stockBefore = (
    await prisma.product.findUniqueOrThrow({ where: { id: productId } })
  ).stock;

  const init = await initializeChapaPayment({
    amount: order.total,
    txRef,
    email: "paytest@shegershop.et",
    firstName: "Payment",
    lastName: "Tester",
    phone: "0911999001",
    title: "ShegerShop",
    description: "Local mock test",
  });

  assert(init.mode === "mock", "initialize returns mock mode");
  assert(
    init.checkoutUrl.includes("tx_ref=") && init.checkoutUrl.includes("mock=1"),
    `checkout URL is mock result page (${init.checkoutUrl.slice(0, 80)}…)`,
  );
  assert(init.checkoutUrl.includes("via=chapa"), "checkout URL tagged via=chapa");

  const verified = await verifyChapaPayment(txRef);
  assert(verified.success === true, "verifyChapaPayment succeeds in mock");
  assert(verified.txRef === txRef, "verify returns same txRef");

  const finalized = await finalizeOnlinePaidOrder(txRef, verified.paymentRef);
  assert(finalized.ok === true, "finalizeOnlinePaidOrder succeeds");
  if (finalized.ok) {
    assert(finalized.order.paymentStatus === "paid", "order paymentStatus=paid");
    assert(finalized.order.status === "placed", "order status=placed");
    assert(finalized.order.paymentMethod === "chapa", "paymentMethod=chapa");
  }

  const stockAfter = (
    await prisma.product.findUniqueOrThrow({ where: { id: productId } })
  ).stock;
  assert(stockAfter === stockBefore - 1, `stock decremented (${stockBefore}→${stockAfter})`);

  const again = await finalizeOnlinePaidOrder(txRef, verified.paymentRef);
  assert(again.ok === true && again.alreadyPaid === true, "finalize is idempotent");

  // cleanup
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.product.update({
    where: { id: productId },
    data: { stock: stockBefore },
  });
  console.log("  cleaned up Chapa test order");
}

async function testTelebirrMock(buyerId: string, productId: string, price: number) {
  console.log("\n=== Telebirr merchant API (mock) ===");
  assert(getTelebirrMode() === "mock", `mode is mock (got ${getTelebirrMode()})`);

  const order = await prisma.order.create({
    data: {
      userId: buyerId,
      status: "awaiting_payment",
      paymentStatus: "pending",
      paymentMethod: "telebirr",
      subtotal: price,
      shipping: 200,
      tax: 0,
      total: price + 200,
      shippingName: "Payment Tester",
      address: "Bole Road",
      city: "Addis Ababa",
      zip: "1000",
      items: {
        create: [
          {
            productId,
            quantity: 1,
            priceAtPurchase: price,
            productName: "Payment Test Item",
          },
        ],
      },
    },
  });

  const merchOrderId = createTelebirrMerchOrderId(order.id);
  assert(/^[A-Za-z0-9]+$/.test(merchOrderId), `merch_order_id alphanumeric (${merchOrderId})`);

  await prisma.order.update({
    where: { id: order.id },
    data: { paymentTxRef: merchOrderId },
  });

  const stockBefore = (
    await prisma.product.findUniqueOrThrow({ where: { id: productId } })
  ).stock;

  const checkout = await createTelebirrCheckout({
    merchOrderId,
    title: "ShegerShop test",
    amount: order.total,
  });

  assert(checkout.mode === "mock", "createTelebirrCheckout returns mock mode");
  assert(
    checkout.checkoutUrl.includes("via=telebirr") &&
      checkout.checkoutUrl.includes("mock=1"),
    "checkout URL is mock Telebirr result page",
  );
  assert(checkout.merchOrderId === merchOrderId, "merchOrderId preserved");

  const verified = await verifyTelebirrPayment(merchOrderId);
  assert(verified.success === true, "verifyTelebirrPayment succeeds in mock");
  assert(verified.merchOrderId === merchOrderId, "verify returns same merchOrderId");

  const notify = parseTelebirrNotify({
    merch_order_id: merchOrderId,
    payment_order_id: "mock-pay-1",
  });
  assert(notify.isSuccess === true, "mock notify parses successfully");
  assert(notify.merchOrderId === merchOrderId, "notify merchOrderId matches");

  const finalized = await finalizeOnlinePaidOrder(
    merchOrderId,
    verified.paymentRef,
  );
  assert(finalized.ok === true, "finalizeOnlinePaidOrder succeeds");
  if (finalized.ok) {
    assert(finalized.order.paymentStatus === "paid", "order paymentStatus=paid");
    assert(finalized.order.status === "placed", "order status=placed");
    assert(finalized.order.paymentMethod === "telebirr", "paymentMethod=telebirr");
  }

  const stockAfter = (
    await prisma.product.findUniqueOrThrow({ where: { id: productId } })
  ).stock;
  assert(stockAfter === stockBefore - 1, `stock decremented (${stockBefore}→${stockAfter})`);

  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.product.update({
    where: { id: productId },
    data: { stock: stockBefore },
  });
  console.log("  cleaned up Telebirr test order");
}

async function testHttpVerifyEndpoints(baseUrl: string) {
  console.log("\n=== HTTP verify endpoints (unauthenticated smoke) ===");

  for (const path of [
    "/api/payments/chapa/verify",
    "/api/payments/telebirr/verify",
  ]) {
    try {
      const res = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txRef: "smoke-unauth" }),
      });
      assert(
        res.status === 401,
        `${path} returns 401 without session (got ${res.status})`,
      );
    } catch (err) {
      failed += 1;
      console.error(
        `  ${FAIL} ${path} unreachable — is bun run dev up? (${err instanceof Error ? err.message : err})`,
      );
    }
  }
}

async function main() {
  console.log("ShegerShop local payment tests");
  console.log(`PAYMENT_MODE=${process.env.PAYMENT_MODE}`);
  console.log(`CHAPA_MODE=${process.env.CHAPA_MODE}`);
  console.log(`TELEBIRR_MODE=${process.env.TELEBIRR_MODE}`);

  const buyer = await ensureBuyer();
  const product = await ensureProduct();
  console.log(`Buyer ${buyer.phone} · product ${product.id} @ ${product.price}`);

  await testChapaMock(buyer.id, product.id, product.price);
  await testTelebirrMock(buyer.id, product.id, product.price);
  await testHttpVerifyEndpoints(
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000",
  );

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`${FAIL} ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log(`${PASS} All Chapa + Telebirr local mock tests passed`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
