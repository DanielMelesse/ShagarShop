# Register shegershop.com and attach to Railway

## Buy the domain

1. Open [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/domains/register) (or [Porkbun](https://porkbun.com))
2. Search **shegershop.com** and complete checkout (payment required — you must do this step)
3. Ensure the domain uses **Cloudflare nameservers** (default when buying via Cloudflare)

## Point DNS at Railway

After Railway shows custom domain instructions (Settings → Networking → Custom Domain):

| Type | Name | Target |
|------|------|--------|
| CNAME | `www` | `<service>.up.railway.app` (Railway value) |
| CNAME | `@` (apex) | same host — Cloudflare flattens apex CNAMEs |

Also add `cdn` CNAME later for R2 public bucket hostname if using `cdn.shegershop.com`.

## Railway

1. Web service → **Custom Domain** → add `shegershop.com` and `www.shegershop.com`
2. Wait until certificate status is **Active**
3. Update variables and redeploy:

```bash
railway variables set \
  NEXTAUTH_URL=https://shegershop.com \
  NEXT_PUBLIC_APP_URL=https://shegershop.com \
  CAPACITOR_SERVER_URL=https://shegershop.com
```

4. Payment webhooks (when going live):

- `https://shegershop.com/api/payments/telebirr/webhook`
- `https://shegershop.com/api/payments/chapa/webhook`

## Verify

```bash
dig +short shegershop.com
dig +short www.shegershop.com
BASE_URL=https://shegershop.com bash scripts/smoke-production.sh
```
