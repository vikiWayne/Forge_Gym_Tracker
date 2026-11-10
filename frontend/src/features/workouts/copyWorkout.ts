import type { Log, WorkoutSet } from "../../shared/api/types";

export type WorkoutDraft = {
  exercise_id: string;
  sets: WorkoutSet[];
  date: string;
  notes: string;
};

/** A reviewable new workout draft, with no source or offline replay identity. */
export function copyWorkoutDraft(log: Log, today: string): WorkoutDraft {
  return {
    exercise_id: log.exercise_id,
    date: today,
    notes: log.notes,
    sets: log.sets.map(({ weight, reps, rpe, rir }) => ({
      weight,
      reps,
      ...(rpe == null ? {} : { rpe }),
      ...(rir == null ? {} : { rir }),
    })),
  };
}
