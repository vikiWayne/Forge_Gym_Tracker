import { db } from "../../database/connection.js";
export async function withSets(logs) {
  const setsByLog = new Map();
  for (let start = 0; start < logs.length; start += 500) {
    const ids = logs.slice(start, start + 500).map((log) => log.id);
    const sets = await db
      .prepare(
        `SELECT log_id,weight,reps,rpe,rir FROM log_sets WHERE log_id IN (${ids.map(() => "?").join(",")}) ORDER BY log_id,position`,
      )
      .all(...ids);
    for (const { log_id, rpe, rir, ...set } of sets) {
      if (!setsByLog.has(log_id)) setsByLog.set(log_id, []);
      setsByLog.get(log_id).push({
        ...set,
        ...(rpe === null ? {} : { rpe }),
        ...(rir === null ? {} : { rir }),
      });
    }
  }
  return logs.map((log) => ({ ...log, sets: setsByLog.get(log.id) ?? [] }));
}
