# FORGE gym tracker

React + TypeScript frontend and Express API with persistent SQLite storage. Users see only the login screen until authenticated. All training pages are protected and display only saved account data. The app never automatically seeds accounts or logs. Explicitly requested demonstration accounts exist only in the local database, which is excluded from release artifacts.

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
| `/login`             | Public        | One username/password action; new users complete illustrated profile setup                   |
| `/dashboard`         | Authenticated | Account statistics, weekly activity and recent workouts                                      |
| `/exercises`         | Authenticated | User-created training categories, exercise library, notes, rep ranges and readiness switches |
| `/workouts`          | Authenticated | Search, edit and delete workout logs                                                         |
| `/workouts/new`      | Authenticated | Choose category/exercise, add individual sets with weight/reps, date and notes               |
| `/workouts/:id/edit` | Authenticated | Edit an owned workout                                                                        |
| `/progress`          | Authenticated | Individual exercise charts with weight and rep axes                                          |
| `/together`          | Authenticated | Shared plans, invitations and per-exercise comparisons                                       |
| `/profile`           | Authenticated | Profile details, username availability/changes and appearance                                |
| `/forgot-password`   | Public        | Reset a password using a saved recovery code                                                 |
| `/protein`           | Authenticated | Protein journal, daily totals and graph                                                      |
| `/body-weight`       | Authenticated | Body-weight journal with notes and a graph                                                   |
| `/calendar`          | Authenticated | Logged gym days and daily workout/protein details                                            |

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

See [the deployment guide](docs/deployment.md) for production configuration, a same-origin production server, persistent storage and backup instructions. Run `npm run check:release` before release. Nothing is published automatically.

## Training categories and sets

Create your own categories from Exercises (for example Push, Pull, Legs, Upper or Lower). Suggested names are shortcuts, not preloaded records. Exercises belong to one of your own categories; the workout form filters exercises by category. Existing exercise categories are retained during migration.

A workout contains 1–50 ordered sets, each with its own weight and reps. Add an empty set or repeat the previous set to speed up logging. Editing replaces the workout’s full set list. Journal and shared-plan tables show every set, and total volume includes all sets. Individual progress charts use each workout’s heaviest set and its associated rep count; shared charts compare each member’s heaviest set per day. Historical single-set logs migrate without changing their recorded weight and reps.

## Invitation notifications

Incoming plan invitations are counted on the header bell and Together navigation badge. The bell lists the sender and plan, with a link to review the invitation. Together shows searchable plan cards; opening a card reveals its invitation actions and shared details. The owner sees pending usernames on each shared plan; accepting moves the partner into the member list. Invitations refresh every 30 seconds while the app is visible and on returning to the tab, without reloading workout forms. Refresh failures are shown in the notification panel. These are in-app notifications; no email or device push notification is sent while the app is closed.

## Unified account entry and profile setup

Enter a username and password once on `/login`. Existing accounts require the correct password and sign in immediately. A new username begins a three-step illustrated setup for age, body weight and sex. Only after valid profile setup is the account created and a full session issued. Short-lived setup records retain only a password hash, expire after 15 minutes and can be cancelled; refreshing the page can resume the username’s pending setup. Previously collected profile fields restart on refresh. A name claimed by another account during setup is rejected rather than signed in.

Profile includes a separate username editor with debounced availability feedback. Names are unique without regard to case, and changes retain the account ID, workout history and shared memberships. The API checks availability again on save.

Modals render through a document-body portal, cover the viewport, lock background scrolling and make the application inert until closed. Keyboard focus is trapped within the dialog and returned to its trigger. Onboarding transitions respect reduced-motion preferences. The login artwork is a new code-native illustration separate from the dashboard artwork.

For an alternate local development frontend, `DEV_ORIGIN` may specify its exact allowed origin; this setting is ignored in production.

## Protein and body-weight journals

Protein entries record grams, date, an optional meal/source and notes. The graph sums entries by day. Body-weight entries record kilograms, date and optional notes; their graph uses the latest entry per day. Both journals support editing/deleting, are private to the account, and do not appear in shared-plan data. All weight inputs and API schemas (including workout sets, profile and onboarding) accept at most two decimal places. The latest dated weigh-in updates the profile weight; deleting the latest restores the preceding weigh-in when one exists. Deleting every weigh-in retains the last profile weight, without creating historical entries.

## Account recovery and password changes

New users receive a one-use recovery code after profile setup, before entering the dashboard. Save it outside the app; it is shown only once and stored as a hash on the server. Existing users can generate or replace a code in Profile → Account security after confirming their current password. Forgot password requires the username, saved code and a new password. Reset consumes the code and signs out all sessions. Without a saved code or an existing signed-in session, the account cannot be reset through this app; no identity-based shortcuts or email delivery are implemented.

Changing a password in Profile requires the current password. The current session stays signed in; other sessions and any previous recovery code are invalidated. Generate a replacement recovery code after changing the password.

## Navigation and calendar

The desktop header has one persistent Log workout action; mobile uses the central bottom-nav action, with a single-line label and safe-area spacing. Duplicate Overview and journal buttons are removed. Mobile More contains the workout journal, calendar, exercises, progress, Together and profile/security. Profile cards are stacked into balanced columns to avoid wasted space under personal details.

Calendar marks days with saved workouts as gym days and elapsed days without logs as No log. Future dates are disabled in the calendar and log forms and rejected by the API. Selecting a date shows all exercise sets, workout notes, protein sources/notes and that day’s protein total, and body-weight entries with notes. Imported workouts also appear automatically. Arrow keys navigate dates; month controls and Today let you browse history. These marks reflect logs, not independently verified gym attendance.

## Workout CSV files

The workout journal supports export and preview-before-import for the versioned FORGE CSV format. Each set is a row; categories, exercise names, dates and notes are retained. Imports are validated and atomic, with duplicate-source protection, and create missing owned exercises/categories. See [the CSV format guide](docs/workout-csv.md) for columns, spreadsheet escaping, limits and round-trip behavior.

## Plans and workout streaks

Together supports searching plan names and partner usernames. Open a plan at `/together/:id` to view comparisons, logs, members and invitations.

Overview shows the current workout streak, personal best, seven-day activity and next milestone. Each logged date counts once; a streak ending yesterday stays active until today ends. Editing or deleting logs recalculates the streak. Animations respect reduced-motion preferences.
