# Expanded training tools

The **Explore tools** page groups training planning, personal journals and Together features. Desktop navigation and mobile **Explore** both link to it. Existing workout logging remains available from the main action.

## Accounts

Sign in or begin setup with an email and password. Emails are case-insensitive and private. A generated public handle can be changed in Profile and is used for invitations. Password recovery uses email plus a previously saved one-use recovery code. No verification email is sent at this stage.

The fresh-start reset was an administrative development action against the local SQLite database. Account backup/restore and self-service account deletion are not product features in this release.

## Weekly goals and scheduling

**Weekly goals** uses a Monday–Sunday week in India time. One or more exercise logs on a date count as one training day. Users select a target of 1–7 days, and rest days do not reset progress.

**Workout schedule** plans an owned routine on a date, including future dates. Completion is explicit: link a saved workout or completed training session from the planned date. Planned sessions do not count as completed workouts until actual activity is saved and linked. Editing, reopening and removing plans preserve journal history.

## Training and wellbeing features

| Feature | Location | Behavior |
| --- | --- | --- |
| Progression suggestions | `/overload` | Reviews every set on two recent saved training dates, rep ranges and optional effort. Changes are suggestions only. |
| Muscle groups | `/muscles` | Tag owned exercises and count saved sets this week. A set tagged with multiple muscles counts in each group. |
| RPE/RIR | Workout forms and active sessions | Optional RPE 1–10 in half points and RIR 0–10. Values survive edits, session resume and offline replay. |
| Alternatives | `/alternatives` | Mutual links between owned movements, with notes and logging shortcuts. |
| Workout copying | Workout journal | Copy saved sets, notes and effort into a fresh, reviewable log dated today. |
| Body measurements | `/measurements` | Private centimeter entries for nine areas; graph uses the latest entry per date. |
| Progress photos | `/photos` | Private dated JPEG/PNG/WebP uploads, resized and re-encoded by the client. Stored bytes are limited to 2 MiB per image and require authenticated reads. |
| Nutrition targets | `/protein` | User-selected daily protein target and totals from today's saved entries, using India time. |
| Recovery | `/recovery` | One private daily check-in for sleep, energy, soreness and mood. |
| Shared routines | Together plan details | Explicitly publish snapshots including disclosed notes. Recipients import independent owned copies. Leaving revokes access to the shared template. |
| Sharing controls | Together plan details | None, selected or all workouts per plan, plus separate notes visibility. Default is private. |

## Offline and installation

The production app precaches its public shell and all built route assets. Previously signed-in users can reopen personal training data offline for up to seven days since the last verified sign-in. New manual workout logs queue on the device, visibly marked as waiting to sync. Reconnection checks account identity and retries with the same client ID to prevent duplicate saves. A failed queued item can be retried or removed from the queue. Browser storage must be available; clearing it removes unsynced device copies.

An active session retains a device draft while offline. Reconnect before finishing or discarding; those actions are never reported as completed without a server response. Together data is not cached offline. Account changes, journals beyond cached training, sharing and photo uploads need a connection. Logout and session expiry clear cached training; local sign-out also prevents cached re-entry while disconnected.

Install controls live in Explore. Supported browsers expose an install prompt; other browsers show platform instructions. Installation and service workers need HTTPS or localhost. New versions offer an update action so active work can be saved before reloading.

## Verification

API tests use in-memory SQLite databases. Production and development instances never seed fixture accounts automatically. Run `npm run check:release` to build and check the application.

