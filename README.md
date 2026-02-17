# Voidspace

A social platform for close connections. Built with Next.js 16, deployed on Cloudflare Pages.

## Features

- **Posts** with 3 privacy levels: Public, Friends, Close Friends
- **Friend system** with regular and close friend requests
- **Direct messages** with real-time polling
- **Media uploads** with 5GB global storage limit
- **Profile editing** (bio, avatar, username, password)
- **Dark theme** with orange accents

## Tech Stack

- Next.js 16 (App Router)
- Cloudflare Pages + D1 (SQLite) + R2 (media storage)
- JWT auth (httpOnly cookies)
- Tailwind CSS v4
- better-sqlite3 (local dev)

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Deploy to Cloudflare

```bash
# Create D1 database and R2 bucket first:
npx wrangler d1 create voidspace-db
npx wrangler r2 bucket create voidspace-media

# Update wrangler.toml with the database_id from above

# Apply schema:
npx wrangler d1 execute voidspace-db --file=db/schema.sql

# Deploy:
npm run deploy
```
