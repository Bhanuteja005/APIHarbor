# Deploying APIHarbor

APIHarbor is deployed as **two pieces**:

- **Backend (this repo's root `Dockerfile`) → Railway.** A Fastify API image —
  PostgreSQL + Redis + the API service.
- **Frontend (`./frontend`, Next.js) → Vercel.** The marketing site and
  dashboard. It calls the backend **server-side** (through Next server
  actions), so the backend needs **no CORS or cookie-SameSite configuration**
  for it.

---

## Part A — Backend on Railway

You need three Railway services:

1. **PostgreSQL** (Railway plugin)
2. **Redis** (Railway plugin)
3. **APIHarbor API** (this repo, built from the root `Dockerfile`)

The repo root already contains everything Railway needs:
`Dockerfile`, `railway.json`, `.dockerignore`.

### 1. Create the project + databases

1. Create a new Railway project.
2. **+ New → Database → Add PostgreSQL.**
3. **+ New → Database → Add Redis.**

### 2. Add the API service

1. **+ New → GitHub Repo** (or **Empty Service** + `railway up` from the CLI) and
   point it at this repository.
2. Railway auto-detects `railway.json` and builds the root `Dockerfile`
   (backend only; the frontend is not part of this image).

### 3. Set environment variables on the API service

In the service's **Variables** tab add:

| Variable | Value |
| --- | --- |
| `DB_CONNECTION_URI` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `ENCRYPTION_KEY` | output of `openssl rand -hex 16` |
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `SITE_URL` | the **frontend's** public URL (your Vercel domain, e.g. `https://apiharbor.vercel.app`) — used for links in emails and redirects |
| `NODE_ENV` | `production` |

`HOST` and `PORT` have safe defaults baked into the image; `PORT` is provided
by Railway automatically.

> `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}` are Railway
> **reference variables** — they resolve to the plugin's connection string. Use
> the exact plugin names shown in your project (e.g. `Postgres`, `Redis`).

Generate the two secrets locally:

```bash
openssl rand -hex 16      # -> ENCRYPTION_KEY
openssl rand -base64 32   # -> AUTH_SECRET
```

**Keep `ENCRYPTION_KEY` stable forever** — rotating it makes every stored API
key undecryptable.

### Optional variables

| Variable | Purpose |
| --- | --- |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME` | Email (signup verification codes, invites, password reset). Strongly recommended in production — without SMTP, verification codes are only printed to the server logs. |
| `CLIENT_ID_GOOGLE_LOGIN`, `CLIENT_SECRET_GOOGLE_LOGIN` | "Continue with Google" SSO |
| `API_KEYS_PER_PROJECT_LIMIT` | Raise the 30-key Free-tier cap for private deployments |

### 4. Networking

Open the API service → **Settings → Networking → Generate Domain**. This URL is
what the frontend's `API_URL` points at (Part B).

### 5. Deploy

Trigger a deploy. Database migrations run in Railway's **pre-deploy** phase
(`preDeployCommand` in `railway.json`): `npm run migration:unlock || true; npm
run migration:latest`. This runs migrations **once per deploy in a separate
one-shot container** (not in the start path), then the app starts with just
`npm start` and Railway's healthcheck polls `/api/status` until it returns
`200`.

> **Why pre-deploy instead of the start command?** If a migration is ever
> interrupted, Knex leaves a lock row in `infisical_migrations_lock`. When
> migrations run inside the start command, every restart re-hits the lock
> ("Migration table is already locked"), the app never boots, and the
> healthcheck fails until it times out. Running them once in pre-deploy — with
> a defensive `migration:unlock` first — both clears any stale lock and keeps a
> failed migration from crash-looping the service. If you set the **Start
> Command** or **Pre-Deploy Command** in the Railway dashboard, those override
> `railway.json`, so make the same change there (Start Command = `npm start`,
> Pre-Deploy Command = `npm run migration:unlock || true; npm run
> migration:latest`).

---

## Part B — Frontend on Vercel

1. **Import the repo in Vercel** and set the project's **Root Directory** to
   `frontend`. Framework preset: Next.js (auto-detected). Vercel uses the
   `pnpm-lock.yaml` automatically.
2. Set three environment variables:

| Variable | Value |
| --- | --- |
| `API_URL` | the Railway API domain from Part A §4, e.g. `https://apiharbor-api-production.up.railway.app` (server-side only, never exposed to the browser) |
| `NEXT_PUBLIC_APP_NAME` | `APIHarbor` |
| `NEXT_PUBLIC_APP_DOMAIN` | your frontend domain, e.g. `apiharbor.vercel.app` (used for SEO metadata) |

3. Deploy. Then copy the Vercel URL into the backend's `SITE_URL` variable on
   Railway (Part A §3) and redeploy the backend so email links point at the
   right origin.

Because the browser only ever talks to the Next.js server (which proxies to
Railway), you do **not** need `CORS_ALLOWED_ORIGINS`, `AUTH_COOKIE_SAME_SITE`,
or `HTTPS_ENABLED` tweaks on the backend for the frontend to work.

---

## First run

Open your Vercel domain → **Get Started** → sign up (email → verification code
→ name/organization/password). A "My Project" workspace is created
automatically and your keys live under **Dashboard → API Keys**.

---

## Notes & troubleshooting

- **Migrations** run in the Railway **pre-deploy** phase (see Part A §5), not
  the start command, so a stale Knex lock can't crash-loop startup. If you ever
  see "Migration table is already locked", clear it with `npm run
  migration:unlock` (or SQL: `UPDATE infisical_migrations_lock SET is_locked =
  0;`) — the pre-deploy step already runs `migration:unlock` defensively before
  migrating.
- **Email is optional but recommended.** Without SMTP, signup verification
  codes are only printed to the backend logs (fine for testing, unusable for
  real customers).
- **The `infisical` CLI + Oracle/FreeTDS drivers** in the image come from the
  upstream base and support enterprise dynamic-secret providers APIHarbor
  doesn't use. If the external CLI apt repo ever breaks the build, you can drop
  the `infisical=0.43.79` install line from the runtime stage.
- **Scaling:** run a single replica unless you also configure the secondary /
  clustering settings — cron jobs self-elect across replicas via Redis.
- **Legacy note:** the old Vite SPA (previously bundled into this image via
  `STANDALONE_MODE`) was replaced by the Next.js app in `./frontend` on
  2026-07-07. `STANDALONE_MODE`, `VITE_API_URL`, and the two-Railway-service
  split described in older versions of this doc no longer apply.
