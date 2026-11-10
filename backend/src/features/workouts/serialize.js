import { db } from "../../database/connection.js";
export function withSets(logs) {
  const find = db.prepare(
    "SELECT weight,reps,rpe,rir FROM log_sets WHERE log_id=? ORDER BY position",
  );
  return logs.map((log) => ({
    ...log,
    sets: find
      .all(log.id)
      .map(({ rpe, rir, ...set }) => ({
        ...set,
        ...(rpe === null ? {} : { rpe }),
        ...(rir === null ? {} : { rir }),
      })),
  }));
}
