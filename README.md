# FORGE gym tracker

React + TypeScript frontend and Express API with persistent SQLite storage. Users see only the login screen until authenticated. All training pages are protected and display only saved account data. There are no seeded accounts, exercises, workouts, or shared plans.

## Run locally

Requires Node.js 22.13+ and npm.

```sh
npm install
npm run dev
```

Open http://localhost:5173. The frontend proxies `/api` to port 3001. Stop both services with Ctrl+C. Some Node versions print an experimental SQLite warning.

## Pages

| URL                  | Access        | Purpose                                                                                      |
| -------------------- | ------------- | -------------------------------------------------------------------------------------------- |
| `/login`             | Public        | Sign in or create an account, including age, body weight and sex                             |
| `/dashboard`         | Authenticated | Account statistics, weekly activity and recent workouts                                      |
| `/exercises`         | Authenticated | User-created training categories, exercise library, notes, rep ranges and readiness switches |
| `/workouts`          | Authenticated | Search, edit and delete workout logs                                                         |
| `/workouts/new`      | Authenticated | Choose category/exercise, add individual sets with weight/reps, date and notes               |
| `/workouts/:id/edit` | Authenticated | Edit an owned workout                                                                        |
| `/progress`          | Authenticated | Individual exercise charts with weight and rep axes                                          |
| `/together`          | Authenticated | Shared plans, invitations and per-exercise comparisons                                       |
| `/profile`           | Authenticated | Profile details and appearance                                                               |

Signed-out visits to private URLs redirect to `/login`. On sign-in, the requested page is restored. Session expiry clears account state and redirects to login. The API separately enforces authentication and resource ownership.

Light/dark mode is available on login and in the app header. The preference is stored on this device; the initial choice follows the system theme.

## Organization

```text
frontend/src/
  app/                 # Router, authenticated layout, auth/data/theme providers
  features/
    auth/              # Login and registration
    dashboard/         # Overview and statistics
    exercises/         # Cards, creation form and library page
    workouts/          # Journal, table and routed editor
    progress/          # Per-exercise charts
    plans/             # Shared plans, forms and comparisons
    profile/           # Profile page and fields
  shared/
    api/               # Fetch client and domain types
    hooks/             # Async action state
    lib/               # Date utilities
    ui/                # Small reusable UI elements
  styles/              # Theme tokens, layout and feature styling
backend/src/
  features/            # Auth, profile, categories, exercises, workouts, plans
  database/            # SQLite connection and schema migrations
  middleware/          # Session checks, origin validation and errors
  shared/              # Common request handler
  app.js               # Middleware and feature composition
  server.js            # Server entry point
scripts/               # Component size enforcement
```

The app layer composes routes, layout and providers; feature modules handle their own screens; shared modules expose reusable UI and API primitives. Authentication and training state are centralized in providers. Every React component file is limited to 300 lines, enforced by `npm run check:components`.

## Validation

```sh
npm run build
npm test
npm run check:components
npm audit
```

API integration tests use a new in-memory database for each test process. Test records never enter the application database. Tests cover authentication, ownership, validation, workout CRUD, invitation consent and logout.

## Sharing

Only accepted members share data. Accepted members see each other’s historical and future workout logs, including notes. Leaving stops access in both directions. Charts compare the heaviest set per member per day for the selected exercise; all records remain in the shared table. A shared plan is a progress group, not a prescribed schedule.

## Deployment

Build with `npm run build` and serve `frontend/dist` behind an HTTPS reverse proxy. Configure SPA history fallback to `index.html` so direct page URLs work. Route `/api` to the Express process (`npm start -w backend`) on the same origin, before the SPA fallback.

Set `NODE_ENV=production` for Secure cookies. If exactly one trusted reverse proxy fronts the API, set `TRUST_PROXY=1` and ensure it overwrites forwarded headers. Use `PORT` for the API port and `DB_PATH` for an absolute writable database path. Persist and back up the database directory. Never expose `backend/data` through the web server.

This is a single-instance application. Multi-instance hosting requires a shared database and distributed rate-limit storage. Account recovery, email verification and operational monitoring are not included. Profile weight is the current value; readiness is a manual indication and does not automatically alter logged weights.

## Training categories and sets

Create your own categories from Exercises (for example Push, Pull, Legs, Upper or Lower). Suggested names are shortcuts, not preloaded records. Exercises belong to one of your own categories; the workout form filters exercises by category. Existing exercise categories are retained during migration.

A workout contains 1–50 ordered sets, each with its own weight and reps. Add an empty set or repeat the previous set to speed up logging. Editing replaces the workout’s full set list. Journal and shared-plan tables show every set, and total volume includes all sets. Individual progress charts use each workout’s heaviest set and its associated rep count; shared charts compare each member’s heaviest set per day. Historical single-set logs migrate without changing their recorded weight and reps.
