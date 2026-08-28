/**
 * Reproduce courier login + session role + delivery API access.
 * Requires: bun run db:up && bun run dev
 *
 *   bun scripts/test-courier-login.ts
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
const PHONE = "0911000002";
const PASSWORD = "delivery123";

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

async function ensureCourier() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  return prisma.user.upsert({
    where: { phone: PHONE },
    update: {
      role: "DELIVERY",
      passwordHash,
      name: "Demo Courier",
      deliveryProfile: {
        upsert: {
          create: {
            vehicleType: "motorcycle",
            serviceArea: "Bole, Addis Ababa",
            active: true,
          },
          update: { active: true, vehicleType: "motorcycle" },
        },
      },
    },
    create: {
      phone: PHONE,
      name: "Demo Courier",
      role: "DELIVERY",
      passwordHash,
      deliveryProfile: {
        create: {
          vehicleType: "motorcycle",
          serviceArea: "Bole, Addis Ababa",
          active: true,
        },
      },
    },
    select: { id: true, phone: true, role: true },
  });
}

async function main() {
  console.log(`Courier login test → ${BASE}`);
  const user = await ensureCourier();
  assert(user.role === "DELIVERY", `DB role is DELIVERY (got ${user.role})`);

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
    callbackUrl: `${BASE}/delivery`,
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
    user?: { id?: string; role?: string; phone?: string };
  };
  console.log("  session", session);
  assert(Boolean(session.user?.id), "session has user id");
  assert(
    session.user?.role === "DELIVERY",
    `session role is DELIVERY (got ${session.user?.role})`,
  );

  const meRes = await fetch(`${BASE}/api/delivery/me`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  const me = await meRes.json().catch(() => ({}));
  console.log("  /api/delivery/me", meRes.status, me);
  assert(meRes.ok, `/api/delivery/me ok (got ${meRes.status})`);

  const jobsRes = await fetch(`${BASE}/api/delivery/jobs?scope=available`, {
    headers: { Cookie: cookieHeader(jar) },
  });
  assert(jobsRes.ok, `/api/delivery/jobs ok (got ${jobsRes.status})`);

  // Page-level: delivery home should not 3xx to signup/register for this cookie
  const pageRes = await fetch(`${BASE}/delivery`, {
    headers: { Cookie: cookieHeader(jar) },
    redirect: "manual",
  });
  const loc = pageRes.headers.get("location") ?? "";
  console.log("  GET /delivery", pageRes.status, loc || "(no location)");
  assert(
    !loc.includes("/signup") && !loc.includes("/deliver/register"),
    "GET /delivery does not redirect to signup/register",
  );
  assert(
    pageRes.status === 200 || pageRes.status === 307 || pageRes.status === 308,
    `GET /delivery responds (${pageRes.status})`,
  );

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`✗ ${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log("✓ Courier login session + delivery API passed");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
