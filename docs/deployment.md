# Preparing a production instance

Use Node.js 24 LTS. Production stores application data in Turso and uses in-memory rate limits on each running instance.

## Release checks

From the repository root:

```sh
npm ci
npm run check:release
npm audit --omit=dev
```

## Run on Render

Set `NODE_ENV=production`, `HOST=0.0.0.0`, `TURSO_DATABASE_URL`, and `TURSO_AUTH_TOKEN` in the Render service environment. Use the database URL from Turso and a database token with read and write access. Production requires both values at startup. Store the token only in the server environment. `DB_PATH` applies to local SQLite.

For a backend-only service, open **Settings → Build & Deploy → Build Filters** in Render. Keep **Auto-Deploy** set to **On Commit**, leave **Root Directory** blank, and add these entries under **Included Paths**:

```text
backend/src/**
backend/package.json
package.json
package-lock.json
```

Leave **Ignored Paths** empty. Backend source and shared dependency changes trigger auto-deploys. Changes confined to frontend files or backend tests skip them. A push that also changes the shared lockfile triggers a deploy.

The production API origin is configured in `frontend/api.config.mjs`. If this service also serves the web app, set the build command to `npm ci --include=dev && npm run build`, set `SERVE_FRONTEND=1`, and include `frontend/**` so web changes are published automatically. Keep `npm start` as the start command. Browser sessions use same-origin cookies, so open the PWA on the Render service URL.

## Run locally with Node.js

Build the frontend with `npm run build:local`. Copy `backend/.env.example` to `backend/.env` and configure:

```dotenv
NODE_ENV=development
HOST=127.0.0.1
PORT=3001
SERVE_FRONTEND=1
DB_PATH=./data/forge.sqlite
TRUST_PROXY=1
```

Create the database directory with write permissions for the application user before starting. Run `npm start` under a service manager. The backend reads `backend/.env`; process environment takes precedence.

Place an HTTPS reverse proxy in front of port 3001. Forward the original Host and protocol. Only set `TRUST_PROXY=1` if exactly one trusted proxy overwrites forwarded headers and the API cannot be reached directly from the public internet. Otherwise omit it. Secure cookies require HTTPS.

Express serves the built frontend, history fallback and API on the same origin. `GET /api/health` is a public, non-sensitive database liveness check. Unknown API routes remain JSON 404 responses.

## Data and recovery

If you have existing production records, back up the old SQLite database before the first Turso deploy. Use Turso's SQLite import to create a database from the backup, verify the accounts, workouts, and photos, then configure Render with that database's URL and token. A new empty Turso database starts with no records. Deploys apply schema migrations and preserve existing rows. [Turso’s import guide](https://docs.turso.tech/cloud/migrate-to-turso)

Back up SQLite using its online backup facility, or stop the application cleanly and copy the database and any accompanying WAL files together. Verify restoration before upgrading. Never copy only a live SQLite main file while writes continue.

The server drains HTTP requests on SIGTERM/SIGINT. Schema migrations run at startup. Back up the Turso database before deploying schema changes.

Passwords are hashed and sessions use HttpOnly, SameSite cookies. Sign-in uses a normalized email; recovery requires that email and a previously saved recovery code. No email verification or delivery is implemented yet. Together memberships default to private workouts; each member explicitly chooses which logs and notes to share. Emails, private journals and photos never appear in shared-plan responses. Photo bytes are stored in the SQLite database, so include them in storage capacity and backup planning.

The service worker caches only public application assets, not API responses or private photos. Device training caches and queued logs are scoped to the signed-in account and cleared on logout/session expiry. Deploy on HTTPS for installation and service-worker support; localhost is supported for development.

Before release, review the live HTTPS login/logout flow, direct page URLs, CSV transfer, backups, invitation consent, keyboard navigation and mobile layouts on the target host. No domain, proxy, external monitoring, or hosting account has been configured by this repository.
