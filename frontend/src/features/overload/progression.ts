import type { Exercise, Log, WorkoutSet } from "../../shared/api/types";

export type ProgressionEvidence = { date: string; sets: WorkoutSet[] };
export type Progression = {
  kind: "insufficient" | "increase" | "hold" | "reduce";
  title: string;
  reason: string;
  weight: number | null;
  evidence: ProgressionEvidence[];
};
export function suggestProgression(
  exercise: Exercise,
  logs: Log[],
  today: string,
  increment = 2.5,
): Progression {
  const min = exercise.rep_min ?? 8,
    max = exercise.rep_max ?? 12;
  const step =
    Number.isFinite(increment) && increment > 0 && increment <= 20
      ? increment
      : 2.5;
  const dates = new Map<string, WorkoutSet[]>();
  for (const log of logs) {
    if (
      log.exercise_id !== exercise.id ||
      log.pending_sync ||
      log.date > today ||
      !/^\d{4}-\d{2}-\d{2}$/.test(log.date)
    )
      continue;
    if (
      !log.sets.length ||
      !log.sets.every(
        (set) =>
          Number.isFinite(set.weight) &&
          set.weight >= 0 &&
          Number.isInteger(set.reps) &&
          set.reps > 0,
      )
    )
      continue;
    dates.set(log.date, [...(dates.get(log.date) || []), ...log.sets]);
  }
  const evidence = [...dates]
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 2)
    .map(([date, sets]) => ({ date, sets }));
  const base = {
    evidence,
    weight: evidence[0]
      ? Math.max(...evidence[0].sets.map((set) => set.weight))
      : null,
  };
  if (evidence.length < 2)
    return {
      ...base,
      kind: "insufficient",
      title: "Build a little more history",
      reason:
        "Log this exercise on two different dates before looking for a progression pattern. Unsynced workouts are left out.",
    };
  const previous = evidence[1];
  const weight = base.weight!;
  const difficult = (set: WorkoutSet) =>
    (set.rpe != null && set.rpe > 8.5) || (set.rir != null && set.rir < 1);
  const repeatedLowReps = evidence.every(
    (day) =>
      day.sets.filter((set) => set.reps < min).length >=
      Math.ceil(day.sets.length / 2),
  );
  if (repeatedLowReps && weight > 0)
    return {
      ...base,
      kind: "reduce",
      weight: Number((weight * 0.95).toFixed(2)),
      title: "Consider a lighter working weight",
      reason: `At least half of your sets were below ${min} reps on both recent dates. Around 5% less weight may help you rebuild reps; choose a load your equipment supports.`,
    };
  if (evidence.some((day) => day.sets.some(difficult)))
    return {
      ...base,
      kind: "hold",
      title: "Keep the weight steady",
      reason:
        "A recent set was above RPE 8.5 or below 1 RIR. Give yourself room to repeat the reps comfortably before increasing.",
    };
  if (weight === 0)
    return {
      ...base,
      kind: "hold",
      title: "Build reps at your current setup",
      reason:
        "These are zero-load or bodyweight sets. Work within your target range; an added-weight suggestion needs a recorded external load.",
    };
  if (weight + step > 1500)
    return {
      ...base,
      kind: "hold",
      title: "Keep the weight within the logging range",
      reason:
        "This increment would exceed the app’s 1,500 kg weight limit. Keep your current recorded load or choose a smaller supported increment.",
    };
  const sameWorkingWeight =
    Math.max(...previous.sets.map((set) => set.weight)) === weight;
  if (
    sameWorkingWeight &&
    evidence.every((day) => day.sets.every((set) => set.reps >= max))
  )
    return {
      ...base,
      kind: "increase",
      weight: Number(Math.min(1500, weight + step).toFixed(2)),
      title: "A small increase may fit",
      reason: `Every saved set reached at least ${max} reps on both recent dates at the same heaviest weight. Consider adding ${step} kg to that working weight, then rebuild within ${min}–${max} reps.`,
    };
  return {
    ...base,
    kind: "hold",
    title: "Keep building at this weight",
    reason: sameWorkingWeight
      ? `Aim to reach ${max} reps across every set on two training dates before increasing. Add reps within your ${min}–${max} target range first.`
      : "Your heaviest weight changed between the two recent dates. Repeat your current setup and build consistent reps before increasing again.",
  };
}
