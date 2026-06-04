# ShagarShop

Standalone marketplace web application built with **Next.js 15**, **Prisma**, **NextAuth**, and **Tailwind CSS 4**.

**Repository:** https://github.com/DanielMelesse/ShagarShop

## Features

- **Database** — SQLite (dev) with Prisma; products, users, orders
- **Auth** — NextAuth credentials (signup with bcrypt)
- **Shop** — browse, filter, search from database
- **Cart** — localStorage (client-side)
- **Checkout** — saves orders to database; updates stock
- **Order history** — `/account/orders` when logged in
- **Birr** pricing, category bar, service pages

## Setup

```bash
bun install
cp .env.example .env   # edit NEXTAUTH_SECRET if needed
bun run db:setup       # create DB + seed products
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

### First-time test

1. Sign up at `/signup` (password min 6 characters)
2. Add products to cart → checkout
3. View orders via header **Orders** link

## Environment

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `file:./dev.db` for SQLite |
| `NEXTAUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | `http://localhost:3000` |

## Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Dev server |
| `bun run db:setup` | Push schema + seed |
| `bun run build` | Production build |

## Production

Switch Prisma to PostgreSQL in `prisma/schema.prisma` and set `DATABASE_URL` to your Postgres URL. Cart remains in localStorage until you add server-side cart later.
