# Cocount Landing

Marketing site for **Cocount** — CRM para inmobiliarias en España.

Standalone Next.js project (static export). Not coupled to the CRM app in `../frontend`.

## Development

```bash
npm install
npm run dev
```

Runs on [http://localhost:3001](http://localhost:3001) (CRM stays on port 3000).

## Environment

Copy `.env.local.example` to `.env.local`:

```bash
NEXT_PUBLIC_SITE_URL=https://cocount.es
NEXT_PUBLIC_APP_URL=https://app.cocount.es
NEXT_PUBLIC_HERO_VARIANT=1
```

`NEXT_PUBLIC_HERO_VARIANT`: `1` | `2` | `3` for A/B headline tests.

## Build (static export)

```bash
npm run build
```

Output is written to `out/` — deploy to Vercel, Netlify, or any static host.

## Deploy on Vercel

Create a **third** Vercel project with root directory `landing`. No server functions required.
