export function validOfflineWorkout(body: Record<string, unknown>) {
  const date = typeof body.date === "string" ? body.date : "";
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const parsed = new Date(`${date}T12:00:00Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== date ||
    date > today
  )
    return false;
  if (
    typeof body.exercise_id !== "string" ||
    !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(body.exercise_id)
  )
    return false;
  if (
    body.notes !== undefined &&
    (typeof body.notes !== "string" || body.notes.length > 1000)
  )
    return false;
  return (
    Array.isArray(body.sets) &&
    body.sets.length >= 1 &&
    body.sets.length <= 50 &&
    body.sets.every((value: unknown) => {
      if (!value || typeof value !== "object") return false;
      const set = value as Record<string, unknown>;
      return (
        typeof set.weight === "number" &&
        Number.isFinite(set.weight) &&
        set.weight >= 0 &&
        set.weight <= 1500 &&
        Number(set.weight.toFixed(2)) === set.weight &&
        typeof set.reps === "number" &&
        Number.isInteger(set.reps) &&
        set.reps >= 1 &&
        set.reps <= 1000 &&
        (set.rpe == null ||
          (typeof set.rpe === "number" &&
            set.rpe >= 1 &&
            set.rpe <= 10 &&
            Number.isInteger(set.rpe * 2))) &&
        (set.rir == null ||
          (typeof set.rir === "number" &&
            Number.isInteger(set.rir) &&
            set.rir >= 0 &&
            set.rir <= 10))
      );
    })
  );
}
