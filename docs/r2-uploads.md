# Cloudflare R2 for ShegerShop uploads

Railway has no persistent disk. Configure R2 before sellers upload products in production.

## Create bucket

1. [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)
2. Create bucket: `shegershop-uploads`
3. Settings → **Public access** → allow, **or** Custom Domains → `cdn.shegershop.com`

## API token

1. R2 → **Manage R2 API Tokens** → Create API token
2. Permission: Object Read & Write on `shegershop-uploads`
3. Copy **Access Key ID**, **Secret Access Key**, and **Account ID**

## Railway variables

```bash
railway variables set \
  S3_BUCKET=shegershop-uploads \
  S3_ACCESS_KEY_ID=<access_key> \
  S3_SECRET_ACCESS_KEY=<secret> \
  S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com \
  S3_PUBLIC_URL=https://cdn.shegershop.com \
  S3_REGION=auto \
  S3_FORCE_PATH_STYLE=true
```

Redeploy the web service after setting vars.

## Verify

1. Log in as a seller on production
2. Upload a product image
3. Confirm the stored URL starts with `https://` (R2/CDN), not `/uploads/`
