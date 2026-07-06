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

Trigger a deploy. On boot the container runs
`npm run migration:latest && npm start`, so **database migrations apply
automatically** (idempotent — safe on every restart). Railway's healthcheck
polls `/api/status` until it returns `200`.

## 6. First run

Open your domain. The first visit shows the marketing landing page. Go to
`/admin/signup` (or click **Get started**) to create the first super-admin
account, then create an organization and a Secrets-Management project. Your API
keys live under **Project → API Keys**.

---

## Notes & troubleshooting

- **Everything is one service.** The API and UI share an origin, so there are no
  CORS settings to manage.
- **Migrations** run on start via `migration:latest`. If you prefer a dedicated
  release phase, move that command to a Railway *pre-deploy* command and change
  the container `CMD`/start command to just `npm start`.
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
