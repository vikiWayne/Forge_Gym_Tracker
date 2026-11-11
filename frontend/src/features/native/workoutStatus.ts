import type { TrainingSession } from "../../shared/api/types";

export const MAX_ACTIVITY_MS = 8 * 60 * 60 * 1000;
export type WorkoutStatus = {
  sessionId: string;
  title: string;
  exercise: string;
  startedAt: number;
  expiresAt: number;
  restUntil: number | null;
  completedSets: number;
  totalSets: number;
};

// Only the minimum information needed by the OS, never notes, email, photos,
// body measurements, weight lifted or credentials.
export function workoutStatus(
  session: TrainingSession,
  now = Date.now(),
): WorkoutStatus | null {
  if (
    session.finished_at ||
    !Number.isFinite(session.started_at) ||
    session.started_at > now ||
    session.started_at + MAX_ACTIVITY_MS <= now
  )
    return null;
  const sets = session.exercises.flatMap((item) => item.sets);
  const next = session.exercises.find((item) =>
    item.sets.some((set) => !set.done),
  );
  return {
    sessionId: session.id,
    title: session.name.slice(0, 80),
    exercise: next?.name.slice(0, 80) || "All sets checked",
    startedAt: session.started_at,
    expiresAt: session.started_at + MAX_ACTIVITY_MS,
    restUntil:
      session.rest_until && session.rest_until > now
        ? Math.min(session.rest_until, session.started_at + MAX_ACTIVITY_MS)
        : null,
    completedSets: sets.filter((set) => set.done).length,
    totalSets: sets.length,
  };
}

export function workoutDeepLink(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "forgegym:" &&
      parsed.hostname === "workout" &&
      parsed.pathname === "/active" &&
      !parsed.search &&
      !parsed.hash
      ? "/workouts/active"
      : null;
  } catch {
    return null;
  }
}
