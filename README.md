# ShegerShop

Standalone marketplace web application built with **Next.js 15**, **Prisma**, **PostgreSQL**, **NextAuth**, and **Tailwind CSS 4**.

**Repository:** https://github.com/DanielMelesse/ShagarShop

## Features

- **Database** — PostgreSQL with Prisma migrations; products, users, orders
- **Auth** — NextAuth credentials (phone + password, optional email)
- **Shop** — browse, filter, search from database
- **Cart** — localStorage (client-side)
- **Checkout** — saves orders to database; updates stock
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

This starts Postgres on `localhost:5432` with user/password/db: `shagar` / `shagar` / `shagarshop` (see `docker-compose.yml`).

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

Example local URL (Docker):

```
postgresql://shagar:shagar@localhost:5432/shagarshop?schema=public
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

1. Provision PostgreSQL (Neon, Supabase, RDS, etc.)
2. Set `DATABASE_URL` to your Postgres URL
3. Run migrations: `bun run db:migrate:deploy`
4. Seed once if needed: `bun run db:seed`
5. Deploy the Next.js app (e.g. Vercel) with `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

Cart remains in localStorage until you add a server-side cart later.

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
