# Deploy Cocount on Vercel (Frontend + Backend + Custom Domain)

This guide deploys the **Next.js frontend** and **NestJS backend** as **two separate Vercel projects**, then connects them to your own domain (example: `cocountluxuryflats.com`).

## Recommended architecture

| Service   | Vercel project   | Domain (example)              |
|-----------|------------------|-------------------------------|
| Frontend  | `cocount-web`    | `https://cocountluxuryflats.com` |
| Backend   | `cocount-api`    | `https://api.cocountluxuryflats.com` |
| Database  | Supabase (external) | `https://xxx.supabase.co` |

The browser talks to the **frontend**. Next.js API routes (`/api/*`) proxy requests to the **backend** using `API_URL`.

```
User → cocountluxuryflats.es (Next.js)
         → /api/workers, /api/auth/login, …
         → api.cocountluxuryflats.com (NestJS)
         → Supabase
```

---

## Prerequisites

- [Vercel account](https://vercel.com) (Hobby or Pro)
- GitHub / GitLab / Bitbucket repo with this project
- [Supabase](https://supabase.com) project with migrations applied
- Your domain (registrar access for DNS)
- **Service role key** from Supabase (not the anon key)

---

## Part 1 — Prepare the backend for Vercel

NestJS normally runs as a long-lived Node server. On Vercel it must run as a **serverless function**. Add these files inside `backend/`.

### 1.1 Create `backend/api/index.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import express from 'express';
import type { VercelRequest, VercelResponse } from '@vercel/node';

let cachedApp: express.Express | null = null;

async function createNestServer(): Promise<express.Express> {
  if (cachedApp) return cachedApp;

  const expressApp = express();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  await app.init();
  cachedApp = expressApp;
  return expressApp;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const app = await createNestServer();
  return app(req, res);
}
```

### 1.2 Create `backend/vercel.json`

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "api/index.ts"
    }
  ]
}
```

### 1.3 Install Vercel types (backend)

```bash
cd backend
npm install express @vercel/node
npm install -D @types/express
```

> `express` is already a transitive dependency of NestJS; installing it explicitly avoids type issues.

### 1.4 Keep `backend/src/main.ts` for local dev

Local development still uses `npm run start:dev` on port `3001`. The `api/index.ts` entry is **only for Vercel**.

---

## Part 2 — Deploy the backend on Vercel

### 2.1 Import project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your Git repository
3. **Root Directory:** `backend`
4. **Framework Preset:** Other
5. **Build Command:** `npm run build`
6. **Output Directory:** leave empty (serverless)

### 2.2 Environment variables (backend)

In Vercel → Project → **Settings → Environment Variables**, add:

| Variable | Example | Notes |
|----------|---------|-------|
| `FRONTEND_URL` | `https://cocountluxuryflats.com` | Must match your real frontend URL (no trailing slash) |
| `JWT_SECRET` | long random string | Use a strong secret in production |
| `SUPABASE_URL` | `https://ojixntkiujsopugmklmc.supabase.co` | Project URL only — **no** `/rest/v1` |
| `SUPABASE_ANON_KEY` | `eyJ...` | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Supabase → Settings → API → **service_role** (secret) |
| `ADMIN_EMAIL` | `admin@cocount.com` | Optional seed admin |
| `ADMIN_PASSWORD` | strong password | Change from default in production |

Apply to **Production**, **Preview**, and **Development**.

### 2.3 Deploy

Click **Deploy**. After success, note the URL, e.g. `https://cocount-api.vercel.app`.

### 2.4 Verify backend

```bash
curl https://cocount-api.vercel.app/
```

You should get a response from the NestJS root route.

Test login:

```bash
curl -X POST https://cocount-api.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cocount.com","password":"YOUR_PASSWORD"}'
```

---

## Part 3 — Deploy the frontend on Vercel

### 3.1 Import project

1. [vercel.com/new](https://vercel.com/new) → same repo, **second project**
2. **Root Directory:** `frontend`
3. **Framework Preset:** Next.js (auto-detected)
4. **Build Command:** `npm run build` (default)
5. **Install Command:** `npm install` (default)

### 3.2 Environment variables (frontend)

| Variable | Example | Notes |
|----------|---------|-------|
| `API_URL` | `https://api.cocountluxuryflats.com` | Server-side only; used by `/api/*` proxy routes |
| `NEXT_PUBLIC_API_URL` | `https://api.cocountluxuryflats.com` | Optional; used by some client code |

Use the **backend URL** (custom domain or `*.vercel.app`). No trailing slash.

> `API_URL` is preferred for server-side proxy routes. Both should point to the same backend.

### 3.3 Deploy

Deploy and open `https://cocount-web.vercel.app` (or your assigned URL). Log in and confirm API calls work.

---

## Part 4 — Custom domain

Example domain: **`cocountluxuryflats.com`**

### 4.1 Frontend domain

1. Vercel → **cocount-web** → **Settings → Domains**
2. Add: `cocountluxuryflats.com`
3. Add: `www.cocountluxuryflats.com` (optional; redirect `www` → apex in Vercel)
4. Vercel shows DNS records to add at your registrar

**Typical DNS (apex domain):**

| Type | Name | Value |
|------|------|-------|
| `A` | `@` | `76.76.21.21` |
| `CNAME` | `www` | `cname.vercel-dns.com` |

(Use the exact values Vercel shows in your dashboard.)

### 4.2 Backend subdomain

1. Vercel → **cocount-api** → **Settings → Domains**
2. Add: `api.cocountluxuryflats.com`

**DNS:**

| Type | Name | Value |
|------|------|-------|
| `CNAME` | `api` | `cname.vercel-dns.com` |

### 4.3 Update environment variables after domain is live

**Backend** (`cocount-api`):

```
FRONTEND_URL=https://cocountluxuryflats.com
```

**Frontend** (`cocount-web`):

```
API_URL=https://api.cocountluxuryflats.com
NEXT_PUBLIC_API_URL=https://api.cocountluxuryflats.com
```

Redeploy both projects after changing env vars.

---

## Part 5 — Supabase configuration

In [Supabase Dashboard](https://supabase.com/dashboard) → your project:

### 5.1 Authentication → URL configuration

| Setting | Value |
|---------|-------|
| **Site URL** | `https://cocountluxuryflats.com` |
| **Redirect URLs** | Add all of these: |

```
https://cocountluxuryflats.com/**
https://cocountluxuryflats.com/aceptar-invitacion
https://cocountluxuryflats.com/restablecer-contraseña
https://cocountluxuryflats.com/recuperar-contraseña
http://localhost:3000/**
```

### 5.2 Email templates (optional)

Invitation and password-reset links use `FRONTEND_URL` from the backend. With production `FRONTEND_URL` set, emails will point to your domain.

### 5.3 SMTP (recommended for production)

Supabase → **Authentication → SMTP**. Configure custom SMTP so worker invitations and password resets are delivered reliably (default Supabase email has rate limits).

### 5.4 Run migrations

In **SQL Editor**, run migrations from `supabase/` if not already applied:

- `schema.sql` (or individual migrations)
- `migration-workers-profile.sql`
- `migration-roles-admin-asesor.sql`
- `migration-clientes.sql`
- Others as needed

---

## Part 6 — CORS and cookies

The backend allows CORS from `FRONTEND_URL` only:

```typescript
// backend/src/main.ts
app.enableCors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
});
```

Auth cookies are set by Next.js API routes with `secure: true` in production. That requires **HTTPS** on your frontend domain (Vercel provides this automatically).

---

## Part 7 — CI / Git workflow

| Branch | Vercel behaviour |
|--------|------------------|
| `main` | Production deploy → your custom domains |
| Other branches | Preview URLs → `*.vercel.app` |

For preview deployments, either:

- Set preview `FRONTEND_URL` / `API_URL` to the preview URLs, or
- Use the same production API URL for previews (simpler; data is shared)

---

## Part 8 — Checklist before go-live

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is the **service_role** key (not anon)
- [ ] `JWT_SECRET` is a long random string (not the dev default)
- [ ] `ADMIN_PASSWORD` changed from `Cocount`
- [ ] `FRONTEND_URL` = production frontend (https, no trailing slash)
- [ ] `API_URL` = production backend
- [ ] Supabase redirect URLs include production domain
- [ ] DNS propagated (can take up to 48h; usually minutes)
- [ ] Login, register, worker invite, password reset tested on production
- [ ] File upload (`/storage/upload`) tested if you use images

---

## Part 9 — Troubleshooting

### "User not allowed" / registration fails

`SUPABASE_SERVICE_ROLE_KEY` is wrong (often the anon key was pasted by mistake).

### CORS errors in browser

`FRONTEND_URL` on the backend does not exactly match the URL in the browser (check `http` vs `https`, `www` vs apex).

### API returns 404 on Vercel

- Confirm `backend/vercel.json` and `backend/api/index.ts` exist
- Root Directory for the API project must be `backend`
- Redeploy after adding serverless files

### Cookies / login works locally but not in production

- Frontend must be served over HTTPS
- `FRONTEND_URL` must match the site origin
- Check browser DevTools → Application → Cookies for `cocount_token`

### Invitation emails not sent

Supabase email rate limit or missing SMTP. User may still be created in Auth; use **Reenviar invitación** later.

### Cold starts (first request slow)

Normal on Vercel serverless. Subsequent requests are faster. For always-on API, consider Railway or Render for the backend instead.

---

## Part 10 — Optional: monorepo single Vercel project

Not recommended for this stack, but possible: deploy only the **frontend** on Vercel and host the **backend** on [Railway](https://railway.app), [Render](https://render.com), or [Fly.io](https://fly.io). Point `API_URL` to that host. NestJS runs more naturally as a persistent Node process there.

If you prefer that setup, still use:

- `cocountluxuryflats.com` → frontend (Vercel)
- `api.cocountluxuryflats.com` → backend (Railway/Render)

---

## Quick reference — URLs

Replace with your domain:

```env
# Backend (Vercel → cocount-api)
FRONTEND_URL=https://cocountluxuryflats.com

# Frontend (Vercel → cocount-web)
API_URL=https://api.cocountluxuryflats.com
NEXT_PUBLIC_API_URL=https://api.cocountluxuryflats.com
```

---

## Local development (unchanged)

```bash
# Terminal 1 — backend
cd backend
npm run start:dev    # http://localhost:3001

# Terminal 2 — frontend
cd frontend
npm run dev          # http://localhost:3000
```

`frontend/.env.local`:

```env
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

`backend/.env`:

```env
FRONTEND_URL=http://localhost:3000
```
