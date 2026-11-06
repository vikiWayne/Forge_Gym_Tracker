# Preparing a production instance

Nothing is deployed by these instructions. Use Node.js 24 LTS and a single running application instance. SQLite and in-memory rate limits are not suitable for horizontally scaled instances.

## Release checks

From the repository root:

```sh
npm ci
npm run check:release
npm audit --omit=dev
```

## Run with Node.js

Build the frontend with `npm run build`. Copy `backend/.env.example` to `backend/.env` and configure:

```dotenv
NODE_ENV=production
HOST=127.0.0.1
PORT=3001
SERVE_FRONTEND=1
DB_PATH=/srv/forge-data/forge.sqlite
TRUST_PROXY=1
```

Create the database directory with write permissions for the application user before starting. Run `npm start` under a service manager. The backend reads `backend/.env`; process environment takes precedence.

Place an HTTPS reverse proxy in front of port 3001. Forward the original Host and protocol. Only set `TRUST_PROXY=1` if exactly one trusted proxy overwrites forwarded headers and the API cannot be reached directly from the public internet. Otherwise omit it. Secure cookies require HTTPS.

Express serves the built frontend, history fallback and API on the same origin. `GET /api/health` is a public, non-sensitive database liveness check. Unknown API routes remain JSON 404 responses.

## Data and recovery

Keep the existing local database private. Do not copy it into a public artifact. For a new production environment, use a fresh database path on persistent storage. The app does not automatically seed test records.

Back up SQLite using its online backup facility, or stop the application cleanly and copy the database and any accompanying WAL files together. Verify restoration before upgrading. Never copy only a live SQLite main file while writes continue.

The server drains HTTP requests on SIGTERM/SIGINT before closing SQLite. Schema migrations run at startup; back up before deploying a version that changes the schema.

Passwords are hashed and sessions use HttpOnly, SameSite cookies. Account recovery requires a previously saved recovery code; there is no email recovery. Accepted Together memberships share all historical and future workout notes with accepted members. Explain this behavior to users before enabling sharing.

Before release, review the live HTTPS login/logout flow, direct page URLs, CSV transfer, backups, invitation consent, keyboard navigation and mobile layouts on the target host. No domain, proxy, external monitoring, or hosting account has been configured by this repository.
