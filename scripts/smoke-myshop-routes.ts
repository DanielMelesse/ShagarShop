/**
 * Smoke-test myshop page links, redirects, and API routes.
 *
 *   bun scripts/smoke-myshop-routes.ts
 *
 * Expects local app at NEXTAUTH_URL or http://127.0.0.1:3000
 */
const BASE =
  process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";

const SELLER_PHONE = "0911000003";
const SELLER_PASSWORD = "seller123";

let failed = 0;

function assert(ok: boolean, msg: string) {
  if (ok) console.log(`  ✓ ${msg}`);
  else {
    failed += 1;
    console.error(`  ✗ ${msg}`);
  }
}

async function check(
  method: string,
  path: string,
  opts: {
    expect?: number | number[];
    headers?: HeadersInit;
    body?: BodyInit | null;
    label?: string;
    follow?: boolean;
  } = {},
) {
  const expect = opts.expect ?? [200, 401, 403];
  const allowed = Array.isArray(expect) ? expect : [expect];
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: opts.headers,
    body: opts.body,
    redirect: opts.follow === false ? "manual" : "follow",
  });
  const ok = allowed.includes(res.status);
  assert(
    ok,
    `${opts.label ?? `${method} ${path}`} → ${res.status} (want ${allowed.join("|")})`,
  );
  return res;
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

async function sellerSession(): Promise<string> {
  let jar: string[] = [];
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar = mergeCookies(jar, parseSetCookies(csrfRes));
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  const signInRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jar.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      phone: SELLER_PHONE,
      password: SELLER_PASSWORD,
      json: "true",
      callbackUrl: `${BASE}/`,
    }),
    redirect: "manual",
  });
  jar = mergeCookies(jar, parseSetCookies(signInRes));
  assert(
    signInRes.ok || signInRes.status === 302,
    `seller login (${signInRes.status})`,
  );
  return jar.join("; ");
}

async function main() {
  console.log(`Smoke myshop routes → ${BASE}\n`);

  // Wait for server
  let up = false;
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) {
        up = true;
        break;
      }
    } catch {
      /* retry */
    }
    await Bun.sleep(1000);
  }
  assert(up, "server /api/health reachable");
  if (!up) {
    process.exit(1);
  }

  console.log("\n— Page links & redirects —");
  await check("GET", "/myshop", { expect: 200, label: "GET /myshop" });
  await check("GET", "/myshop/register", {
    expect: 200,
    label: "GET /myshop/register",
  });

  for (const path of [
    "/myshop/listings",
    "/myshop/orders",
    "/myshop/earnings",
    "/myshop/add",
    "/myshop/scan",
  ]) {
    // Unauthenticated gated pages redirect to login
    const res = await fetch(`${BASE}${path}`, { redirect: "manual" });
    const loc = res.headers.get("location") ?? "";
    assert(
      res.status === 200 ||
        res.status === 307 ||
        res.status === 308 ||
        res.status === 302 ||
        (res.status >= 300 && res.status < 400),
      `GET ${path} → ${res.status}${loc ? ` loc=${loc}` : ""}`,
    );
  }

  // Legacy redirects
  for (const [from, to] of [
    ["/sell", "/myshop"],
    ["/sell/register", "/myshop/register"],
    ["/seller", "/myshop"],
    ["/seller/listings", "/myshop/listings"],
  ] as const) {
    const res = await fetch(`${BASE}${from}`, { redirect: "manual" });
    const loc = res.headers.get("location") ?? "";
    assert(
      (res.status === 308 || res.status === 307 || res.status === 301) &&
        loc.includes(to),
      `redirect ${from} → ${to} (got ${res.status} ${loc || "no loc"})`,
    );
  }

  console.log("\n— Public APIs —");
  await check("GET", "/api/health", { expect: 200 });
  await check("GET", "/api/products", { expect: 200 });
  await check("GET", "/api/products/search?q=demo", { expect: [200, 400] });

  console.log("\n— Myshop APIs (unauthenticated → 401) —");
  for (const path of [
    "/api/myshop/me",
    "/api/myshop/products",
    "/api/myshop/orders",
    "/api/myshop/earnings",
    "/api/myshop/register/status",
  ]) {
    await check("GET", path, { expect: 401 });
  }

  console.log("\n— Legacy /api/seller rewrite —");
  await check("GET", "/api/seller/me", {
    expect: 401,
    label: "GET /api/seller/me (rewrite→myshop, 401)",
  });

  console.log("\n— Myshop APIs (seller session) —");
  const cookie = await sellerSession();
  const auth = { Cookie: cookie };

  const me = await check("GET", "/api/myshop/me", {
    expect: 200,
    headers: auth,
  });
  const meJson = (await me.json()) as {
    registrationComplete?: boolean;
    profile?: { shopName?: string };
  };
  assert(
    meJson.registrationComplete === true,
    `seller registrationComplete (${meJson.profile?.shopName ?? "?"})`,
  );

  await check("GET", "/api/myshop/products", { expect: 200, headers: auth });
  await check("GET", "/api/myshop/orders", { expect: 200, headers: auth });
  await check("GET", "/api/myshop/earnings", { expect: 200, headers: auth });
  await check("GET", "/api/myshop/register/status", {
    expect: 200,
    headers: auth,
  });

  // Authenticated gated pages
  console.log("\n— Authenticated myshop pages —");
  for (const path of [
    "/myshop",
    "/myshop/listings",
    "/myshop/orders",
    "/myshop/earnings",
    "/myshop/add",
    "/myshop/scan",
  ]) {
    await check("GET", path, {
      expect: 200,
      headers: auth,
      label: `GET ${path} (authed)`,
    });
  }

  // Catalog still works
  console.log("\n— Buyer /shop still intact —");
  await check("GET", "/shop?all=1", { expect: 200 });

  console.log("\n────────────────────────────");
  if (failed > 0) {
    console.error(`✗ ${failed} check(s) failed`);
    process.exit(1);
  }
  console.log("✓ All smoke checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
