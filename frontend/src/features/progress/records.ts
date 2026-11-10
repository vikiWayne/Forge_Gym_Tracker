import type { Log } from "../../shared/api/types";
export function personalRecords(logs: Log[]) {
  let heaviest = 0,
    mostReps = 0,
    estimatedMax = 0,
    volume = 0;
  const repRecords = new Map<number, number>();
  for (const log of logs) {
    if (log.pending_sync) continue;
    let sessionVolume = 0;
    for (const set of log.sets) {
      heaviest = Math.max(heaviest, set.weight);
      mostReps = Math.max(mostReps, set.reps);
      // Epley is useful for low-rep working sets; omit higher-rep estimates.
      if (set.reps <= 10)
        estimatedMax = Math.max(
          estimatedMax,
          set.reps === 1 ? set.weight : set.weight * (1 + set.reps / 30),
        );
      repRecords.set(
        set.reps,
        Math.max(repRecords.get(set.reps) ?? 0, set.weight),
      );
      sessionVolume += set.weight * set.reps;
    }
    volume = Math.max(volume, sessionVolume);
  }
  return {
    heaviest,
    mostReps,
    estimatedMax,
    volume,
    repRecords: [...repRecords].sort(([a], [b]) => a - b),
  };
}
