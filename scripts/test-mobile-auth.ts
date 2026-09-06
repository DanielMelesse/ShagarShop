/**
 * Smoke test: mobile JWT login, Bearer auth on /api/cart, token refresh.
 * Requires: bun run db:up && bun run dev
 */
const BASE = process.env.TEST_BASE_URL?.trim() || "http://localhost:3000";
const PHONE = process.env.TEST_MOBILE_PHONE?.trim() || "0912345678";
const PASSWORD = process.env.TEST_MOBILE_PASSWORD?.trim() || "seller123";

async function main() {
  const loginRes = await fetch(`${BASE}/api/auth/mobile/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone: PHONE, password: PASSWORD }),
  });
  const login = (await loginRes.json().catch(() => null)) as {
    error?: string;
    accessToken?: string;
    refreshToken?: string;
    user?: { id: string };
  } | null;
  if (!loginRes.ok || !login) {
    throw new Error(`Login failed: ${login?.error ?? loginRes.status}`);
  }

  const { accessToken, refreshToken, user } = login;
  if (!accessToken || !refreshToken || !user?.id) {
    throw new Error("Login response missing tokens or user.");
  }
  console.log("✓ mobile login", user.phone, user.role);

  const cartRes = await fetch(`${BASE}/api/cart`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-sheger-client": "mobile",
    },
  });
  const cart = await cartRes.json();
  if (!cartRes.ok) {
    throw new Error(`Cart GET failed: ${cart.error ?? cartRes.status}`);
  }
  console.log("✓ Bearer cart", Array.isArray(cart.items) ? cart.items.length : 0, "items");

  const refreshRes = await fetch(`${BASE}/api/auth/mobile/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  const refreshed = await refreshRes.json();
  if (!refreshRes.ok || !refreshed.accessToken) {
    throw new Error(`Refresh failed: ${refreshed.error ?? refreshRes.status}`);
  }
  console.log("✓ token refresh");

  const productsRes = await fetch(`${BASE}/api/products?page=1&limit=5`);
  const products = await productsRes.json();
  if (!productsRes.ok || !Array.isArray(products.products)) {
    throw new Error(`Products API failed: ${productsRes.status}`);
  }
  console.log("✓ product catalog", products.products.length, "products");

  console.log("\nMobile auth smoke test passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
