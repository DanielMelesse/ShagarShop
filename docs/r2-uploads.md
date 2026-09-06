# Object storage for ShegerShop uploads

Railway has no persistent disk. Configure S3-compatible storage before sellers upload products in production.

## Option A — Railway Bucket (recommended for first launch)

Already available in the `shegershop` Railway project:

```bash
railway bucket create shegershop-uploads --region sjc --json
railway bucket credentials --bucket shegershop-uploads --json
```

Wire into the **web** service:

```bash
railway variables set \
  S3_BUCKET=<bucketName from credentials> \
  S3_ACCESS_KEY_ID=<accessKeyId> \
  S3_SECRET_ACCESS_KEY=<secretAccessKey> \
  S3_ENDPOINT=<endpoint> \
  S3_PUBLIC_URL=https://<bucketName>.t3.storageapi.dev \
  S3_REGION=auto \
  S3_FORCE_PATH_STYLE=false
```

## Option B — Cloudflare R2 (optional CDN later)

1. [Cloudflare Dashboard → R2](https://dash.cloudflare.com/?to=/:account/r2)
2. Create bucket: `shegershop-uploads`
3. Settings → **Public access** → allow, **or** Custom Domains → `cdn.shegershop.com`
4. **Manage R2 API Tokens** → Create API token (Object Read & Write)
5. Set Railway `S3_*` vars with R2 endpoint `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` and `S3_PUBLIC_URL=https://cdn.shegershop.com`

## Verify

1. Log in as a seller on production
2. Upload a product image
3. Confirm the stored URL starts with `https://` (bucket/CDN), not `/uploads/`
