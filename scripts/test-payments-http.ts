/**
 * Authenticated HTTP checkout smoke for Chapa + Telebirr (mock).
 * Requires `bun run dev` on NEXTAUTH_URL (default http://127.0.0.1:3000).
 *
 *   bun scripts/test-payments-http.ts
 */
process.env.PAYMENT_MODE = "mock";
process.env.CHAPA_MODE = "mock";
process.env.TELEBIRR_MODE = "mock";

import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/db";

const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
const PHONE = "0911999001";
const PASSWORD = "buyer123";

let failed = 0;

function assert(ok: boolean, msg: string) {
  if (ok) console.log(`  ✓ ${msg}`);
  else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function parseSetCookies(res: Response): string[] {
  // Bun / undici may expose getSetCookie()
  const anyHeaders = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    return anyHeaders.getSetCookie();
  }
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function cookieHeader(cookies: string[]): string {
  return cookies
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function ensureBuyer() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { phone: PHONE },
    update: { role: "BUYER", passwordHash, name: "Payment Test Buyer" },
    create: {
      phone: PHONE,
      name: "Payment Test Buyer",
      role: "BUYER",
      passwordHash,
    },
  });
}

async function login(): Promise<string> {
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const jar = parseSetCookies(csrfRes);

  const body = new URLSearchParams({
    csrfToken,
    phone: PHONE,
    password: PASSWORD,
    json: "true",
    callbackUrl: `${BASE}/checkout`,
  });

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body,
    redirect: "manual",
  });
  jar.push(...parseSetCookies(signInRes));

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = (await sessionRes.json()) as { user?: { id?: string } };
  assert(Boolean(session.user?.id), "logged in with NextAuth session");
  return cookieHeader(jar);
}

async function placeAndVerify(
  cookie: string,
  paymentMethod: "chapa" | "telebirr",
  productId: string,
) {
  console.log(`\n=== HTTP ${paymentMethod} checkout ===`);

  const orderRes = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      items: [{ productId, quantity: 1 }],
      shippingName: "HTTP Tester",
      address: "Bole",
      city: "Addis Ababa",
      zip: "1000",
      paymentMethod,
    }),
  });
  const orderData = (await orderRes.json()) as {
    error?: string;
    order?: { id: string; paymentTxRef?: string; paymentMethod?: string };
    payment?: { checkoutUrl?: string; txRef?: string; mode?: string };
  };

  assert(orderRes.ok, `POST /api/orders ok (${orderRes.status})`);
  if (!orderRes.ok) {
    console.error("   ", orderData.error);
    return;
  }

  assert(
    orderData.payment?.mode === "mock",
    `payment mode mock (got ${orderData.payment?.mode})`,
  );
  assert(
    Boolean(orderData.payment?.checkoutUrl),
    "checkoutUrl returned",
  );
  assert(
    orderData.order?.paymentMethod === paymentMethod,
    `order.paymentMethod=${paymentMethod}`,
  );

  const txRef =
    orderData.payment?.txRef || orderData.order?.paymentTxRef || "";
  assert(Boolean(txRef), `txRef present (${txRef})`);

  const verifyPath =
    paymentMethod === "telebirr"
      ? "/api/payments/telebirr/verify"
      : "/api/payments/chapa/verify";

  const verifyRes = await fetch(`${BASE}${verifyPath}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ txRef, merchOrderId: txRef, mock: true }),
  });
  const verifyData = (await verifyRes.json()) as {
    ok?: boolean;
    orderId?: string;
    error?: string;
  };

  assert(verifyRes.ok && verifyData.ok === true, `verify ${verifyPath} ok`);
  assert(
    verifyData.orderId === orderData.order?.id,
    "verified order id matches",
  );

  const dbOrder = await prisma.order.findUnique({
    where: { id: orderData.order!.id },
  });
  assert(dbOrder?.paymentStatus === "paid", "DB paymentStatus=paid");
  assert(dbOrder?.status === "placed", "DB status=placed");

  // Restore stock + remove test order
  const items = await prisma.orderItem.findMany({
    where: { orderId: orderData.order!.id },
  });
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } },
    });
  }
  await prisma.orderItem.deleteMany({ where: { orderId: orderData.order!.id } });
  await prisma.order.delete({ where: { id: orderData.order!.id } });
  console.log("  cleaned up HTTP test order");
}

async function main() {
  console.log(`HTTP payment tests → ${BASE}`);
  await ensureBuyer();
  const product = await prisma.product.findFirst({
    where: { stock: { gte: 2 } },
  });
  if (!product) throw new Error("No product in stock — run bun run db:seed");

  const cookie = await login();
  await placeAndVerify(cookie, "chapa", product.id);
  await placeAndVerify(cookie, "telebirr", product.id);

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`✗ ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("✓ Chapa + Telebirr authenticated HTTP tests passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
