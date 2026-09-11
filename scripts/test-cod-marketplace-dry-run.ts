/**
 * Full marketplace dry run: buyer COD → seller ship → courier claim → deliver.
 * Requires: bun run db:up && bun run db:setup && bun run dev
 *
 *   bun scripts/test-cod-marketplace-dry-run.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

const BUYER = { phone: "0911999001", password: "buyer123", name: "Dry Run Buyer" };
const SELLER = { phone: "0911000003", password: "seller123" };
const COURIER = { phone: "0911000002", password: "delivery123" };
const PRODUCT_ID = "demo-seller-earbuds";

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

async function ensureBuyer() {
  const passwordHash = await bcrypt.hash(BUYER.password, 10);
  return prisma.user.upsert({
    where: { phone: BUYER.phone },
    update: { role: "BUYER", passwordHash, name: BUYER.name },
    create: {
      phone: BUYER.phone,
      name: BUYER.name,
      role: "BUYER",
      passwordHash,
    },
  });
}

async function ensureProductStock() {
  const product = await prisma.product.findUnique({
    where: { id: PRODUCT_ID },
  });
  assert(Boolean(product), `product ${PRODUCT_ID} exists`);
  if (!product) return null;
  if (product.stock < 1) {
    await prisma.product.update({
      where: { id: PRODUCT_ID },
      data: { stock: 10 },
    });
  }
  return product;
}

async function login(phone: string, password: string): Promise<string> {
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
      phone,
      password,
      json: "true",
      callbackUrl: `${BASE}/`,
    }),
    redirect: "manual",
  });
  jar = mergeCookies(jar, parseSetCookies(signInRes));
  assert(
    signInRes.ok || signInRes.status === 302,
    `login ${phone} (${signInRes.status})`,
  );
  return cookieHeader(jar);
}

async function main() {
  console.log(`COD marketplace dry run → ${BASE}\n`);

  await ensureBuyer();
  const product = await ensureProductStock();
  if (!product) {
    process.exit(1);
  }

  // —— 1. Buyer places COD order ——
  console.log("— Buyer: place COD order —");
  const buyerCookie = await login(BUYER.phone, BUYER.password);
  const orderRes = await fetch(`${BASE}/api/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: buyerCookie,
    },
    body: JSON.stringify({
      items: [{ productId: PRODUCT_ID, quantity: 1 }],
      shippingName: BUYER.name,
      address: "Bole Road",
      city: "Addis Ababa",
      zip: "1000",
      paymentMethod: "cod",
    }),
  });
  const orderJson = (await orderRes.json()) as {
    error?: string;
    order?: {
      id: string;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
      items?: { id: string; fulfillmentStatus: string }[];
    };
    payment?: { method?: string };
  };
  assert(orderRes.ok, `POST /api/orders (${orderRes.status}) ${orderJson.error ?? ""}`);
  assert(orderJson.order?.status === "placed", `order status placed (got ${orderJson.order?.status})`);
  assert(
    orderJson.order?.paymentStatus === "cod",
    `paymentStatus cod (got ${orderJson.order?.paymentStatus})`,
  );
  assert(orderJson.payment?.method === "cod", "payment.method is cod");

  const orderId = orderJson.order!.id;

  // —— 2. Seller marks shipped ——
  console.log("\n— Seller: mark shipped + tracking —");
  const sellerCookie = await login(SELLER.phone, SELLER.password);

  const listRes = await fetch(`${BASE}/api/myshop/orders`, {
    headers: { Cookie: sellerCookie },
  });
  const listJson = (await listRes.json()) as {
    orders?: { id: string; orderId: string; fulfillmentStatus: string }[];
  };
  assert(listRes.ok, `GET /api/myshop/orders (${listRes.status})`);
  const line =
    listJson.orders?.find(
      (o) => o.orderId === orderId && o.fulfillmentStatus === "pending",
    ) ?? listJson.orders?.find((o) => o.orderId === orderId);
  assert(Boolean(line), `seller sees order line for ${orderId}`);
  const orderItemId = line!.id;

  const shipRes = await fetch(`${BASE}/api/myshop/orders/${orderItemId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: sellerCookie,
    },
    body: JSON.stringify({ fulfillmentStatus: "shipped" }),
  });
  const shipJson = (await shipRes.json()) as {
    error?: string;
    order?: { fulfillmentStatus?: string; trackingCode?: string | null };
  };
  assert(shipRes.ok, `PATCH ship (${shipRes.status}) ${shipJson.error ?? ""}`);
  assert(
    shipJson.order?.fulfillmentStatus === "shipped",
    `fulfillmentStatus shipped (got ${shipJson.order?.fulfillmentStatus})`,
  );
  assert(
    Boolean(shipJson.order?.trackingCode),
    `trackingCode assigned (${shipJson.order?.trackingCode ?? "none"})`,
  );
  const trackingCode = shipJson.order!.trackingCode!;

  // —— 3. Courier claim ——
  console.log("\n— Courier: claim job —");
  const courierCookie = await login(COURIER.phone, COURIER.password);

  const availableRes = await fetch(
    `${BASE}/api/delivery/jobs?scope=available`,
    { headers: { Cookie: courierCookie } },
  );
  const availableJson = (await availableRes.json()) as {
    jobs?: { id: string }[];
  };
  assert(availableRes.ok, `GET available jobs (${availableRes.status})`);
  const job =
    availableJson.jobs?.find((j) => j.id === orderItemId) ??
    availableJson.jobs?.[0];
  assert(Boolean(job), "job available for courier");

  const claimRes = await fetch(`${BASE}/api/delivery/jobs/${job!.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: courierCookie,
    },
    body: JSON.stringify({ action: "claim" }),
  });
  const claimJson = (await claimRes.json()) as { error?: string; ok?: boolean };
  assert(claimRes.ok, `claim job (${claimRes.status}) ${claimJson.error ?? ""}`);

  // —— 4. Courier deliver ——
  console.log("\n— Courier: deliver —");
  const deliverRes = await fetch(`${BASE}/api/delivery/jobs/${job!.id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: courierCookie,
    },
    body: JSON.stringify({ action: "deliver" }),
  });
  const deliverJson = (await deliverRes.json()) as {
    error?: string;
  };
  assert(
    deliverRes.ok,
    `deliver job (${deliverRes.status}) ${deliverJson.error ?? ""}`,
  );

  // —— 5. Verify DB end state ——
  console.log("\n— Verify end state —");
  const item = await prisma.orderItem.findUnique({
    where: { id: orderItemId },
    include: { order: true },
  });
  assert(item?.fulfillmentStatus === "delivered", `DB fulfillment delivered`);
  assert(Boolean(item?.deliveredAt), "DB deliveredAt set");
  assert(Boolean(item?.deliveryId), "DB deliveryId set");
  assert(item?.trackingCode === trackingCode, "DB trackingCode preserved");
  assert(item?.order.paymentStatus === "cod", "DB paymentStatus still cod");
  assert(item?.order.status === "placed", "DB order status still placed");

  // Scan lookup still works
  const scanRes = await fetch(
    `${BASE}/api/tracking/scan?code=${encodeURIComponent(trackingCode)}`,
    { headers: { Cookie: sellerCookie } },
  );
  assert(scanRes.ok, `tracking scan lookup (${scanRes.status})`);

  console.log("\n────────────────────────────");
  console.log(`Order:     ${orderId}`);
  console.log(`Item:      ${orderItemId}`);
  console.log(`Tracking:  ${trackingCode}`);
  if (failed > 0) {
    console.error(`✗ ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("✓ COD marketplace dry run passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
