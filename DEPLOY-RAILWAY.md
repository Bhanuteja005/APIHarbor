# Deploying APIHarbor to Railway

APIHarbor ships as a **single Docker image** that builds the React SPA and the
Fastify API and serves both on one port (the backend serves the UI in
`STANDALONE_MODE`). You need three Railway services:

1. **PostgreSQL** (Railway plugin)
2. **Redis** (Railway plugin)
3. **APIHarbor** (this repo, built from the root `Dockerfile`)

The repo root already contains everything Railway needs:
`Dockerfile`, `railway.json`, `.dockerignore`.

---

## 1. Create the project + databases

1. Create a new Railway project.
2. **+ New → Database → Add PostgreSQL.**
3. **+ New → Database → Add Redis.**

## 2. Add the APIHarbor service

1. **+ New → GitHub Repo** (or **Empty Service** + `railway up` from the CLI) and
   point it at this repository.
2. Railway auto-detects `railway.json` and builds the root `Dockerfile`.
   Build takes a while the first time (it compiles the SPA + API and pulls
   native DB drivers).

## 3. Set environment variables on the APIHarbor service

In the service's **Variables** tab add:

| Variable | Value |
| --- | --- |
| `DB_CONNECTION_URI` | `${{Postgres.DATABASE_URL}}` |
| `REDIS_URL` | `${{Redis.REDIS_URL}}` |
| `ENCRYPTION_KEY` | output of `openssl rand -hex 16` |
| `AUTH_SECRET` | output of `openssl rand -base64 32` |
| `SITE_URL` | your public URL, e.g. `https://apiharbor-production.up.railway.app` |
| `NODE_ENV` | `production` |
| `STANDALONE_MODE` | `true` |

`HOST`, `PORT`, and `STANDALONE_MODE` also have safe defaults baked into the
image; `PORT` is provided by Railway automatically.

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
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_ADDRESS`, `SMTP_FROM_NAME` | Email (verification, invites, password reset) |
| `CLIENT_ID_GOOGLE_LOGIN`, `CLIENT_SECRET_GOOGLE_LOGIN` | "Continue with Google" SSO |
| `API_KEYS_PER_PROJECT_LIMIT` | Raise the 30-key Free-tier cap for private deployments |

## 4. Networking

Open the APIHarbor service → **Settings → Networking → Generate Domain**. Copy
that URL into `SITE_URL` and redeploy so cookies/redirects use the right origin.

## 5. Deploy

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

## 6. First run

Open your domain. The first visit shows the marketing landing page. Go to
`/admin/signup` (or click **Get started**) to create the first super-admin
account, then create an organization and a Secrets-Management project. Your API
keys live under **Project → API Keys**.

---

## Alternative: two-service (split) deployment

Instead of the single combined image you can run the **frontend and backend as
two separate Railway services**. This is more moving parts — only do it if you
need to (e.g. independent scaling or a CDN in front of the SPA).

Services:

- **APIHarbor-Backend** — root directory `/backend`, builds `backend/Dockerfile`
  (API only). Uses `backend/railway.json` (pre-deploy migrations).
- **APIHarbor-Frontend** — root directory `/frontend`, builds
  `frontend/Dockerfile` (Vite build → nginx). Uses `frontend/railway.json`.

Because the two services are on **different origins**, you must configure three
things that the combined deploy doesn't need — CORS, the API URL, and the
auth-cookie SameSite policy:

**On the frontend service:**

| Variable | Value |
| --- | --- |
| `VITE_API_URL` | the backend's public URL, e.g. `https://apiharbor-backend-production.up.railway.app` (baked into the bundle + CSP at build time — redeploy the frontend after changing it) |

**On the backend service (in addition to the variables in §3):**

| Variable | Value |
| --- | --- |
| `CORS_ALLOWED_ORIGINS` | JSON array with the frontend origin, e.g. `["https://apiharbor-frontend-production.up.railway.app"]` |
| `AUTH_COOKIE_SAME_SITE` | `none` — lets the session cookie be sent cross-site (default `strict` only works same-origin) |
| `HTTPS_ENABLED` | `true` — required so the `SameSite=None` cookie is also marked `Secure` (browsers reject `None` without `Secure`) |
| `SITE_URL` | the **frontend** URL (used for links in emails, redirects) |

> **Cross-site cookie caveat.** Railway's generated `*.up.railway.app` domains
> are treated as separate sites (public-suffix), so the login session cookie is
> a genuine cross-site cookie — hence `AUTH_COOKIE_SAME_SITE=none` +
> `HTTPS_ENABLED=true`. If you'd rather keep the stricter same-site cookies,
> put both services on subdomains of one custom domain (e.g.
> `app.example.com` + `api.example.com`) instead; then `strict`/`lax` still work.

---

## Notes & troubleshooting

- **Everything is one service.** The API and UI share an origin, so there are no
  CORS settings to manage.
- **Migrations** run in the Railway **pre-deploy** phase (see §5), not the start
  command, so a stale Knex lock can't crash-loop startup. If you ever see
  "Migration table is already locked", clear it with `npm run migration:unlock`
  (or SQL: `UPDATE infisical_migrations_lock SET is_locked = 0;`) — the
  pre-deploy step already runs `migration:unlock` defensively before migrating.
- **Build memory:** the SPA build sets `NODE_OPTIONS=--max-old-space-size=4096`.
  If the frontend build OOMs on a small build plan, raise it in the `Dockerfile`
  frontend stage.
- **Email is optional.** Without SMTP, signups are auto-usable but email
  verification / invites are disabled.
- **The `infisical` CLI + Oracle/FreeTDS drivers** in the image come from the
  upstream base and support enterprise dynamic-secret providers APIHarbor
  doesn't use. If the external CLI apt repo ever breaks the build, you can drop
  the `infisical=0.43.79` install line from the runtime stage.
- **Scaling:** run a single replica unless you also configure the secondary /
  clustering settings — cron jobs self-elect across replicas via Redis.
