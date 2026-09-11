const BASE = process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://127.0.0.1:3000";
import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === "route.ts") out.push(p);
  }
  return out;
}

const methRe = /export async function (GET|POST|PUT|PATCH|DELETE|HEAD)/g;
let fail = 0;
let pass = 0;

for (const f of walk("src/app/api").sort()) {
  const src = readFileSync(f, "utf8");
  const methods = [...src.matchAll(methRe)].map((m) => m[1]);
  let path = f.replace(/^src\/app/, "").replace(/\/route\.ts$/, "");
  path = path
    .replace(/\[\.\.\.([^\]]+)\]/g, "test")
    .replace(/\[([^\]]+)\]/g, "test-id");
  const tryMethod = methods.includes("GET")
    ? "GET"
    : methods.includes("HEAD")
      ? "HEAD"
      : methods[0] || "GET";
  try {
    const res = await fetch(BASE + path, {
      method: tryMethod,
      redirect: "manual",
    });
    const ok = res.status < 500;
    console.log(`${ok ? "✓" : "✗"} ${tryMethod.padEnd(6)} ${path} → ${res.status}`);
    if (ok) pass++;
    else fail++;
  } catch {
    console.log(`✗ ${tryMethod.padEnd(6)} ${path} → ERROR`);
    fail++;
  }
}

console.log(`\nAPI mount check: ${pass} ok, ${fail} failed`);
if (fail) process.exit(1);
