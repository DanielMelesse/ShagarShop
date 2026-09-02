/**
 * Seller-assigned package barcodes when marking ready for delivery.
 * Requires: bun run db:up && bun run dev
 *
 *   bun scripts/test-package-barcode.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { isValidPackageBarcode, normalizePackageBarcode } from "../src/lib/barcode";

const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
const PHONE = "0912345678";
const PASSWORD = "seller123";
const TEST_BARCODE = "PKG-TEST-12345";

const prisma = new PrismaClient();
let failed = 0;

function assert(ok: boolean, msg: string) {
  if (ok) console.log(`  ✓ ${msg}`);
  else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

function parseSetCookies(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}

function mergeCookies(jar: string[], incoming: string[]) {
  const map = new Map<string, string>();
  for (const c of [...jar, ...incoming]) {
    const pair = c.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    map.set(pair.slice(0, eq), pair);
  }
  return [...map.values()];
}

function cookieHeader(jar: string[]) {
  return jar.join("; ");
}

async function main() {
  console.log(`Package barcode test → ${BASE}`);

  assert(isValidPackageBarcode(TEST_BARCODE), `test barcode valid (${TEST_BARCODE})`);
  assert(
    isValidPackageBarcode(normalizePackageBarcode("  pkg-test-12345  ")),
    "normalizes scanned input",
  );

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const seller = await prisma.user.upsert({
    where: { phone: PHONE },
    update: { role: "SELLER", passwordHash, name: "Daniel Tesfu" },
    create: {
      phone: PHONE,
      name: "Daniel Tesfu",
      role: "SELLER",
      passwordHash,
    },
    select: { id: true },
  });

  await prisma.sellerProfile.upsert({
    where: { userId: seller.id },
    update: {
      shopName: "Big Baby Shop",
      completedAt: new Date(),
    },
    create: {
      userId: seller.id,
      shopName: "Big Baby Shop",
      category: "toys-games",
      location: "addis ababa",
      licenseUrl: "/uploads/licenses/demo-seller.pdf",
      completedAt: new Date(),
    },
  });

  let product = await prisma.product.findFirst({
    where: { sellerId: seller.id },
    select: { id: true },
  });
  if (!product) {
    product = await prisma.product.create({
      data: {
        id: `test-barcode-${Date.now()}`,
        name: "Barcode Test Toy",
        description: "Test product for package barcodes",
        price: 100,
        image: "/uploads/products/placeholder.webp",
        category: "toys-games",
        stock: 10,
        sellerId: seller.id,
      },
      select: { id: true },
    });
  }

  const buyer =
    (await prisma.user.findFirst({
      where: { role: "BUYER" },
      select: { id: true },
    })) ??
    (await prisma.user.create({
      data: {
        phone: "0900111222",
        name: "Barcode Buyer",
        role: "BUYER",
        passwordHash,
      },
      select: { id: true },
    }));

  const order = await prisma.order.create({
    data: {
      userId: buyer.id,
      subtotal: 100,
      shipping: 50,
      tax: 0,
      total: 150,
      shippingName: "Test Buyer",
      address: "Bole",
      city: "Addis Ababa",
      zip: "1000",
      paymentMethod: "cod",
      paymentStatus: "cod",
      status: "placed",
      items: {
        create: {
          productId: product.id,
          quantity: 1,
          priceAtPurchase: 100,
          productName: "Barcode Test Toy",
          fulfillmentStatus: "pending",
          sellerEarnings: 100,
        },
      },
    },
    include: { items: true },
  });
  const orderItemId = order.items[0]!.id;

  let jar: string[] = [];
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar = mergeCookies(jar, parseSetCookies(csrfRes));
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookieHeader(jar),
    },
    body: new URLSearchParams({
      csrfToken,
      phone: PHONE,
      password: PASSWORD,
      json: "true",
    }),
    redirect: "manual",
  });
  jar = mergeCookies(jar, parseSetCookies(signInRes));
  assert(signInRes.ok || signInRes.status === 302, "seller signed in");

  const noBarcodeRes = await fetch(`${BASE}/api/seller/orders/${orderItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({ fulfillmentStatus: "shipped" }),
  });
  assert(noBarcodeRes.status === 400, "mark ready without barcode rejected");

  const patchRes = await fetch(`${BASE}/api/seller/orders/${orderItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieHeader(jar),
    },
    body: JSON.stringify({
      fulfillmentStatus: "shipped",
      trackingCode: TEST_BARCODE,
    }),
  });
  const patchJson = (await patchRes.json().catch(() => ({}))) as {
    order?: { trackingCode?: string; fulfillmentStatus?: string };
    error?: string;
  };
  console.log("  mark ready", patchRes.status, patchJson);
  assert(patchRes.ok, `mark ready ok (got ${patchRes.status})`);
  assert(patchJson.order?.fulfillmentStatus === "shipped", "status is shipped");
  const code = patchJson.order?.trackingCode ?? "";
  assert(code === TEST_BARCODE, `trackingCode saved (${code})`);

  const dbItem = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    select: { trackingCode: true },
  });
  assert(dbItem?.trackingCode === TEST_BARCODE, "DB stores seller barcode");

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`✗ ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("✓ Seller-assigned package barcode flow passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
