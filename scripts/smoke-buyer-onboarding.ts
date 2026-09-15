import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const BASE = "http://127.0.0.1:3000";
const PHONE = "0911888001";
const PASS = "buyer123";
const prisma = new PrismaClient();

function parseSetCookies(res: Response): string[] {
  const h = res.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = res.headers.get("set-cookie");
  return single ? [single] : [];
}
function merge(jar: string[], inc: string[]) {
  const map = new Map<string, string>();
  for (const c of [...jar, ...inc]) {
    const pair = c.split(";")[0];
    const eq = pair.indexOf("=");
    if (eq === -1) continue;
    map.set(pair.slice(0, eq), pair);
  }
  return [...map.values()];
}

const hash = await bcrypt.hash(PASS, 10);
await prisma.user.upsert({
  where: { phone: PHONE },
  update: {
    role: "BUYER",
    passwordHash: hash,
    name: "Onboard Buyer",
    buyerOnboardingCompletedAt: null,
  },
  create: {
    phone: PHONE,
    name: "Onboard Buyer",
    role: "BUYER",
    passwordHash: hash,
  },
});

async function login(): Promise<string> {
  let jar: string[] = [];
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`);
  jar = merge(jar, parseSetCookies(csrfRes));
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };
  const signIn = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jar.join("; "),
    },
    body: new URLSearchParams({
      csrfToken,
      phone: PHONE,
      password: PASS,
      json: "true",
      callbackUrl: `${BASE}/`,
    }),
    redirect: "manual",
  });
  jar = merge(jar, parseSetCookies(signIn));
  return jar.join("; ");
}

const cookie1 = await login();
const session1 = await (
  await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: cookie1 } })
).json();
console.log("before", {
  role: session1.user?.role,
  done: session1.user?.buyerOnboardingDone,
});

const patch = await fetch(`${BASE}/api/account/onboarding`, {
  method: "PATCH",
  headers: { Cookie: cookie1 },
});
console.log("patch", patch.status, await patch.json());

const cookie2 = await login();
const session2 = await (
  await fetch(`${BASE}/api/auth/session`, { headers: { Cookie: cookie2 } })
).json();
console.log("after", {
  role: session2.user?.role,
  done: session2.user?.buyerOnboardingDone,
});

const home = await fetch(`${BASE}/`, { headers: { Cookie: cookie2 } });
console.log("home", home.status);

await prisma.$disconnect();

if (session1.user?.buyerOnboardingDone !== false) {
  console.error("FAIL: expected buyerOnboardingDone false before");
  process.exit(1);
}
if (session2.user?.buyerOnboardingDone !== true) {
  console.error("FAIL: expected buyerOnboardingDone true after");
  process.exit(1);
}
console.log("✓ onboarding smoke ok");
