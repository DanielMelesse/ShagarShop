# Register shegershop.com and attach to Railway

## Buy the domain

1. Open [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/domains/register) or [Porkbun](https://porkbun.com/checkout/domains?search=shegershop.com)
2. Search **shegershop.com** and complete checkout (payment required)
3. Prefer Cloudflare nameservers if buying via Cloudflare

## DNS records (Railway already awaiting this)

Railway custom domain is registered for apex `shegershop.com`. Add:

| Type | Name / Host | Value |
|------|-------------|--------|
| CNAME | `@` / `shegershop.com` | `3syisljp.up.railway.app` |
| TXT | `_railway-verify` | `railway-verify=46c458a9598691725c13005d2cf1291e2dee2cba4240cc193b4785b787dd140e` |

Notes:

- Cloudflare apex CNAME uses **CNAME flattening** (allowed).
- Free Railway plans may allow only **one** custom domain — `www` needs a plan upgrade or redirect at the DNS/CDN layer.
- After DNS propagates, Railway issues TLS automatically.

Check status:

```bash
railway domain status shegershop.com
dig +short shegershop.com CNAME
dig +short _railway-verify.shegershop.com TXT
```

## After TLS is active

```bash
railway variables set \
  NEXTAUTH_URL=https://shegershop.com \
  NEXT_PUBLIC_APP_URL=https://shegershop.com \
  CAPACITOR_SERVER_URL=https://shegershop.com
```

Payment webhooks (when going live):

- `https://shegershop.com/api/payments/telebirr/webhook`
- `https://shegershop.com/api/payments/chapa/webhook`

## Verify

```bash
BASE_URL=https://shegershop.com bash scripts/smoke-production.sh
```
