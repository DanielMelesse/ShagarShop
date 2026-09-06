# ShegerShop

Standalone marketplace web application built with **Next.js 15**, **Prisma**, **PostgreSQL**, **NextAuth**, and **Tailwind CSS 4**.

**Repository:** https://github.com/DanielMelesse/ShegerShop

## Features

- **Database** — PostgreSQL with Prisma migrations; products, users, orders
- **Auth** — NextAuth credentials (phone + password, optional email)
- **Shop** — browse, filter, search from database
- **Cart** — localStorage (client-side)
- **Checkout** — Telebirr (Ethio Telecom merchant H5) and Chapa (separate merchant APIs), or cash on delivery; stock updates when paid (or on COD place)
- **Order history** — `/account/orders` when logged in
- **Birr** pricing, category bar, Today's Deals, service pages

## Setup

### 1. Install dependencies

```bash
bun install --ignore-scripts
cp .env.example .env   # optional — predev creates .env on first run
```

### 2. Start PostgreSQL (Docker)

```bash
bun run db:up
```

This starts Postgres on `localhost:5432` with user/password/db: `sheger` / `sheger` / `shegershop` (see `docker-compose.yml`).

Docker Desktop must be installed and running. The script will try to auto-start Docker on Mac.

### 3. Migrate and seed

```bash
bun run db:setup
```

### 4. Run the app

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal).

**One-liner** (after Docker is installed):

```bash
bun run setup && bun run db:up && bun run dev
```

### First-time test

1. Sign up at `/signup` (full name, phone, password required; email optional)
2. Add products to cart → checkout (log in with phone + password)
3. View orders via header **Orders** link

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `CHAPA_SECRET_KEY` | Chapa merchant secret (optional locally — mock without it) |
| `CHAPA_MODE` | `mock` or `live` (optional) |
| `TELEBIRR_FABRIC_APP_ID` | Ethio Telecom Telebirr fabric app id |
| `TELEBIRR_APP_SECRET` | Telebirr app secret |
| `TELEBIRR_MERCHANT_APP_ID` | Telebirr merchant app id |
| `TELEBIRR_MERCHANT_CODE` | Telebirr merchant code |
| `TELEBIRR_PRIVATE_KEY` | RSA private key (PEM or bare base64) |
| `TELEBIRR_MODE` | `mock` or `live` (optional) |
| `PAYMENT_MODE` | Global `mock` / `live` override (optional) |

Example local URL (Docker):

```
postgresql://sheger:sheger@localhost:5432/shegershop?schema=public
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server |
| `bun run db:up` | Start local Postgres (Docker) |
| `bun run db:down` | Stop local Postgres |
| `bun run db:ping` | Test DATABASE_URL connection |
| `bun run setup` | `bun install` + database setup |
| `bun run db:setup` | Migrate + seed (creates `.env` if missing) |
| `bun run db:migrate` | Create/apply migrations in dev (`migrate dev`) |
| `bun run db:migrate:deploy` | Apply migrations in production/CI |
| `bun run db:seed` | Seed products only |
| `bun run db:generate` | Regenerate Prisma client |
| `bun run build` | Production build |
| `bun run clean` | Remove `.next` and `out` |

## Production

See **[docs/production.md](docs/production.md)** for the full Railway + Cloudflare R2 + `shegershop.com` runbook.

Short path:

1. Deploy to Railway from GitHub `main` (uses `railway.toml` / `nixpacks.toml`)
2. Add Railway PostgreSQL and set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`
3. Configure Cloudflare R2 (`S3_*`) so seller uploads survive redeploys
4. Attach custom domain `shegershop.com` in Railway + Cloudflare DNS
5. Seed once: `railway run bun prisma/seed.ts`

### Troubleshooting

**`Unknown argument phone` on signup**

Regenerate Prisma client and restart dev:

```bash
bun run db:generate
bun run dev
```

**`db:up` exited with code 1 / Docker not running**

Docker Desktop must be **installed and running** before `bun run db:up`.

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) if needed
2. Open it from Applications and wait until it shows **Running**
3. Run `bun run db:up` again (it will try to auto-start Docker on Mac)

**`Can't reach database server`**

Ensure Postgres is running:

```bash
bun run db:up
bun run db:ping
docker compose ps
```

**`dyld: Library not loaded: libicui18n.60.dylib` / `SIGABRT`**

Use project scripts (Bun + `scripts/prisma.sh`), not plain `prisma` or `npm`:

```bash
bun install --ignore-scripts
bun run db:setup
bun run dev
```
