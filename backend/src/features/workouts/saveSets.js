export function setInserts(logId, sets) {
  return sets.map((set, index) => ({
    sql: "INSERT INTO log_sets(log_id,position,weight,reps,rpe,rir) VALUES(?,?,?,?,?,?)",
    args: [
      logId,
      index + 1,
      set.weight,
      set.reps,
      set.rpe ?? null,
      set.rir ?? null,
    ],
  }));
}
