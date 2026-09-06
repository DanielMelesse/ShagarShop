# ShegerShop production runbook (Railway + Cloudflare)

## Live production (Railway)

- **App URL:** https://web-production-29dfe.up.railway.app
- **Project:** `shegershop` (Railway)
- **Custom domain (pending DNS):** `shegershop.com` → CNAME `3syisljp.up.railway.app`
- **TXT verify:** `_railway-verify` = `railway-verify=46c458a9598691725c13005d2cf1291e2dee2cba4240cc193b4785b787dd140e`
- **Uploads:** Railway S3 bucket + `/api/uploads/object/...` proxy
- **Seeded:** admin `0911000001` / `admin123`, courier `0911000002` / `delivery123`

Buy the domain (Porkbun/Cloudflare), add the DNS records above, then:

```bash
railway variables set \
  NEXTAUTH_URL=https://shegershop.com \
  NEXT_PUBLIC_APP_URL=https://shegershop.com \
  CAPACITOR_SERVER_URL=https://shegershop.com
```

## Architecture

- **App:** Railway service (Next.js) from GitHub `main`
- **Database:** Railway PostgreSQL (`DATABASE_URL`)
- **Uploads:** Cloudflare R2 via `S3_*` env (local disk is ephemeral on Railway)
- **Domain:** `shegershop.com` → Railway custom domain + Cloudflare DNS

## 1. Repo config (already in git)

| File | Purpose |
|------|---------|
| `railway.toml` | Build, migrate, start, healthcheck |
| `nixpacks.toml` | Bun install/build on Railway |
| `Dockerfile` | Optional fallback builder |
| `scripts/railway-start.sh` | Migrate + `next start` on `0.0.0.0` |

## 2. Create Railway project

```bash
# Install CLI (once): https://docs.railway.com/guides/cli
npm i -g @railway/cli   # or: bun add -g @railway/cli
railway login
railway init            # link DanielMelesse/ShagarShop → main
railway add --database postgres
```

Or in the dashboard: **New Project → Deploy from GitHub** → select `ShagarShop` → add **PostgreSQL**.

Attach Postgres to the web service so `DATABASE_URL` is injected automatically.

## 3. Environment variables

Set on the **web** service (Variables):

```bash
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://<your-service>.up.railway.app   # update after domain
NEXT_PUBLIC_APP_URL=https://<your-service>.up.railway.app
PAYMENT_MODE=mock
SMS_PROVIDER=console

# After R2 is ready:
S3_BUCKET=shegershop-uploads
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_PUBLIC_URL=https://cdn.shegershop.com
S3_REGION=auto
S3_FORCE_PATH_STYLE=true

# After shegershop.com is live:
# NEXTAUTH_URL=https://shegershop.com
# NEXT_PUBLIC_APP_URL=https://shegershop.com
# CAPACITOR_SERVER_URL=https://shegershop.com
# TELEBIRR_NOTIFY_URL=https://shegershop.com/api/payments/telebirr/webhook
# TELEBIRR_REDIRECT_URL=https://shegershop.com/checkout/result?via=telebirr
```

Deploy:

```bash
railway up
# or push to main if GitHub deploy is connected
```

## 4. Cloudflare R2 (seller uploads)

1. Cloudflare Dashboard → **R2** → Create bucket `shegershop-uploads`
2. Enable public access **or** custom domain `cdn.shegershop.com`
3. **Manage R2 API Tokens** → Create token (Object Read & Write)
4. Copy Account ID, Access Key ID, Secret Access Key into Railway `S3_*` vars
5. Redeploy the web service

Without R2, product images uploaded by sellers disappear on every redeploy.

## 5. Buy and attach shegershop.com

1. Buy at [Cloudflare Registrar](https://dash.cloudflare.com/) (or Porkbun)
2. Railway → web service → **Settings → Networking → Custom Domain**
   - Add `shegershop.com` and `www.shegershop.com`
3. Cloudflare DNS (zone for shegershop.com):
   - `CNAME www` → Railway-provided hostname (e.g. `xxx.up.railway.app`)
   - Apex: use Cloudflare CNAME flattening to the same Railway host (or A/AAAA Railway shows)
4. Wait for Railway TLS certificate (usually a few minutes)
5. Update Railway env URLs to `https://shegershop.com` and redeploy

## 6. Seed production (once)

```bash
railway run bun prisma/seed.ts
```

Demo accounts (from seed):

| Role | Phone | Password |
|------|-------|----------|
| Admin | 0911000001 | admin123 |
| Delivery | 0911000002 | delivery123 |
| Seller | 0912345678 | seller123 |

Change passwords after first login.

## 7. Smoke test

```bash
BASE=https://shegershop.com   # or Railway URL
curl -sS -o /dev/null -w "%{http_code}\n" "$BASE/"
curl -sS "$BASE/api/products?page=1" | head -c 200
bun run test:mobile-auth   # set TEST_BASE_URL=$BASE
```

Checklist:

- [ ] Homepage 200
- [ ] `/api/products` returns JSON
- [ ] Login / signup works over HTTPS
- [ ] Seller upload returns `https://` R2 URL
- [ ] Capacitor `CAPACITOR_SERVER_URL` points at production

## 8. Capacitor after production URL is stable

```bash
export CAPACITOR_SERVER_URL=https://shegershop.com
bun run cap:sync
bun run cap:open:android
```

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Build fails on Prisma | Ensure `DATABASE_URL` exists at **build** time only if generate needs it (generate does not need DB); migrate runs in `preDeployCommand` |
| P1001 / can't reach DB | Confirm Postgres plugin is linked to the web service |
| Images 404 after redeploy | Configure R2 `S3_*` vars |
| Auth redirect loop | `NEXTAUTH_URL` must exactly match the public HTTPS origin |
| App unreachable | Start must bind `0.0.0.0` — use `bun run start:railway` |
