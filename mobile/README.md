# ShegerShop Mobile (Capacitor)

Hybrid Android/iOS app loading the production Next.js site for fast updates in Ethiopia.

## Prerequisites

- Node 18+ / Bun
- Android Studio (Play Store beta target)
- Xcode (optional, for iOS)

## Environment

```bash
NEXTAUTH_SECRET=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
CAPACITOR_SERVER_URL=https://yourdomain.com   # URL loaded in WebView

# Optional cloud uploads (R2/S3)
S3_BUCKET=...
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_ENDPOINT=https://....r2.cloudflarestorage.com
S3_PUBLIC_URL=https://cdn.yourdomain.com

# Optional FCM push
FIREBASE_SERVER_KEY=...
```

## Build native shells

```bash
bun install
bun run cap:sync          # copies config; no static export needed (remote URL mode)
bun run cap:open:android  # open Android Studio
bun run cap:open:ios      # open Xcode
```

The app uses **remote server mode** (`capacitor.config.ts` → `server.url`). Ship web fixes without waiting for store review; bump native shell only when adding plugins or URL scheme changes.

## Deep links (Telebirr / Chapa)

Register URL scheme `shegershop://` in native projects:

- **Android:** `android/app/src/main/AndroidManifest.xml` — intent filter for `shegershop` scheme, host `payment`, path `/result`
- **iOS:** `Info.plist` — `CFBundleURLTypes` with scheme `shegershop`

Payment return: `shegershop://payment/result?via=telebirr&tx_ref=...`

Checkout sends `x-sheger-client: capacitor` so orders API returns mobile deep-link return URLs.

## Mobile API

| Endpoint | Purpose |
|----------|---------|
| `POST /api/auth/mobile/login` | JWT access + refresh tokens |
| `POST /api/auth/mobile/refresh` | Rotate refresh token |
| `GET /api/products` | Paginated catalog (20/page) |
| `GET /api/products/[id]` | Product detail |
| `GET/POST/PATCH/DELETE /api/cart` | Server cart (Bearer or cookie) |
| `POST /api/push/register` | FCM device token |

Protected routes accept **NextAuth cookie** or `Authorization: Bearer <accessToken>`.

## Test locally

```bash
bun run db:up && bun run dev
bun run test:mobile-auth
```

## Play Store beta (Addis)

1. Deploy web to HTTPS with Telebirr/Chapa credentials
2. Set `CAPACITOR_SERVER_URL` to production URL
3. `bun run cap:open:android` → Build → Generate signed AAB
4. Upload to Google Play Internal/Closed testing
5. Test: login, catalog, cart, Telebirr checkout round-trip, seller scan at `/seller/scan`

## Amharic

Use the language switcher in the header (`LanguageSwitcher`) — Amharic strings live in `src/i18n/messages/am.ts`.
