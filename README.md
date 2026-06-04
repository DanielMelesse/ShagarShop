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

One command (creates `.env` automatically on first run):

```bash
bun install --ignore-scripts && bun run db:setup && bun run dev
```

Or use the `setup` script after cloning (skips broken Node postinstall hooks):

```bash
bun run setup && bun run dev
```

Manual steps (optional):

```bash
bun install
cp .env.example .env   # only if you want to customize before first run
bun run db:setup
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) (or the port shown in the terminal if 3000 is busy).

### Troubleshooting

**`Unknown argument phone` on signup**

Prisma Client is out of date. Regenerate and restart the dev server:

```bash
bun run db:generate
bash scripts/prisma.sh db push
# stop dev server (Ctrl+C), then:
bun run dev
```

**`dyld: Library not loaded: libicui18n.60.dylib` / `SIGABRT` on `prisma generate`**

Your shell is picking up broken Homebrew **Node 9** (`/usr/local/Cellar/node/9.4.0`). Do **not** run plain `prisma` or `bun install` without `--ignore-scripts` on this machine.

Install [Bun](https://bun.sh), then use the project scripts (they run Prisma/Next via Bun and a sanitized PATH):

```bash
bun install --ignore-scripts
bun run db:setup
bun run dev
```

To remove the bad Node from your PATH (optional):

```bash
brew unlink node@9 2>/dev/null || true
brew install node@22 && brew link --overwrite node@22
```

### First-time test

1. Sign up at `/signup` (full name, phone, password required; email optional)
2. Add products to cart → checkout (log in with phone + password)
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
| `bun run setup` | `bun install` + database setup |
| `bun run db:setup` | Generate client, push schema, seed (creates `.env` if missing) |
| `bun run db:generate` | Regenerate Prisma client only |
| `bun run build` | Production build |
| `bun run clean` | Remove `.next` and `out` build output |

## Production

Switch Prisma to PostgreSQL in `prisma/schema.prisma` and set `DATABASE_URL` to your Postgres URL. Cart remains in localStorage until you add server-side cart later.
