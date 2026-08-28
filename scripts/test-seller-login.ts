/**
 * Seller login should land on /seller (dashboard), not the shop.
 * Requires: bun run db:up && bun run dev
 *
 *   bun scripts/test-seller-login.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { resolveAfterAuth } from "../src/lib/auth-redirect";

const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
const PHONE = "0912345678";
const PASSWORD = "seller123";

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

async function ensureSeller() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { phone: PHONE },
    update: {
      role: "SELLER",
      passwordHash,
      name: "Daniel Tesfu",
      sellerProfile: {
        upsert: {
          create: {
            shopName: "Big Baby Shop",
            category: "toys-games",
            location: "addis ababa",
            licenseUrl: "/uploads/licenses/demo-seller.pdf",
            completedAt: new Date(),
          },
          update: {
            shopName: "Big Baby Shop",
            completedAt: new Date(),
          },
        },
      },
    },
    create: {
      phone: PHONE,
      name: "Daniel Tesfu",
      role: "SELLER",
      passwordHash,
      sellerProfile: {
        create: {
          shopName: "Big Baby Shop",
          category: "toys-games",
          location: "addis ababa",
          licenseUrl: "/uploads/licenses/demo-seller.pdf",
          completedAt: new Date(),
        },
      },
    },
    select: { id: true, phone: true, role: true },
  });
}

async function main() {
  console.log(`Seller login redirect test → ${BASE}`);

  assert(
    resolveAfterAuth(null, "SELLER") === "/seller",
    "resolveAfterAuth(null, SELLER) → /seller",
  );
  assert(
    resolveAfterAuth("/", "SELLER") === "/seller",
    "resolveAfterAuth(/, SELLER) → /seller",
  );
  assert(
    resolveAfterAuth("/cart", "SELLER") === "/seller",
    "resolveAfterAuth(/cart, SELLER) → /seller",
  );
  assert(
    resolveAfterAuth("/sell", "SELLER") === "/seller",
    "resolveAfterAuth(/sell, SELLER) → /seller",
  );
  assert(
    resolveAfterAuth("/seller/orders", "SELLER") === "/seller/orders",
    "resolveAfterAuth(/seller/orders, SELLER) keeps deep link",
  );

  const user = await ensureSeller();
  assert(user.role === "SELLER", `DB role is SELLER (got ${user.role})`);

  let jar: string[] = [];

  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar = mergeCookies(jar, parseSetCookies(csrfRes));
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  assert(Boolean(csrfToken), "got csrf token");

  const body = new URLSearchParams({
    csrfToken,
    phone: PHONE,
    password: PASSWORD,
    json: "true",
    callbackUrl: `${BASE}/`,
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
  jar = mergeCookies(jar, parseSetCookies(signInRes));
  const signInJson = await signInRes.json().catch(() => ({}));
  console.log("  signIn status", signInRes.status, signInJson);
  assert(
    signInRes.ok || signInRes.status === 302,
    `credentials callback ok (status ${signInRes.status})`,
  );

  const sessionRes = await fetch(`${BASE}/api/auth/session`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const session = (await sessionRes.json()) as {
    user?: { id?: string; role?: string };
  };
  console.log("  session", session);
  assert(Boolean(session.user?.id), "session has user id");
  assert(
    session.user?.role === "SELLER",
    `session role is SELLER (got ${session.user?.role})`,
  );

  const dest = resolveAfterAuth("/", session.user?.role);
  assert(dest === "/seller", `post-login dest is /seller (got ${dest})`);

  const meRes = await fetch(`${BASE}/api/seller/me`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  assert(meRes.ok, `/api/seller/me ok (got ${meRes.status})`);

  const pageRes = await fetch(`${BASE}/seller`, {
    headers: { Cookie: cookieHeader(jar) },
    redirect: "manual",
  });
  const loc = pageRes.headers.get("location") ?? "";
  console.log("  GET /seller", pageRes.status, loc || "(no location)");
  assert(
    !loc.includes("/signup") && !loc.includes("/login"),
    "GET /seller does not bounce to login/signup",
  );
  assert(
    pageRes.status === 200 || pageRes.status === 307 || pageRes.status === 308,
    `GET /seller responds (${pageRes.status})`,
  );

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`✗ ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("✓ Seller login redirects to dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
