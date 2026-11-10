import { randomUUID } from "node:crypto";
import { db } from "../../database/connection.js";
import {
  CSV_VERSION,
  encodeCsv,
  fingerprint,
  WorkoutCsvError,
} from "./workoutCsvFormat.js";
import { validateWorkouts } from "./workoutCsvValidation.js";
export function initializeCsvImports() {
  db.exec(
    "CREATE TABLE IF NOT EXISTS workout_csv_receipts(user_id TEXT NOT NULL REFERENCES users(id),source_id TEXT NOT NULL,fingerprint TEXT NOT NULL,log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,source_id))",
  );
}
function existingWorkout(logId, userId) {
  const row = db
    .prepare(
      "SELECT l.*,e.name AS exercise,e.category FROM logs l JOIN exercises e ON e.id=l.exercise_id WHERE l.id=? AND l.user_id=?",
    )
    .get(logId, userId);
  return row
    ? {
        ...row,
        sets: db
          .prepare(
            "SELECT weight,reps FROM log_sets WHERE log_id=? ORDER BY position",
          )
          .all(logId),
      }
    : null;
}
export function exportWorkouts(userId) {
  const logs = db
    .prepare(
      "SELECT l.*,e.name AS exercise,e.category,e.notes AS exercise_notes,e.rep_min,e.rep_max FROM logs l JOIN exercises e ON e.id=l.exercise_id WHERE l.user_id=? ORDER BY l.date,l.rowid",
    )
    .all(userId);
  const rows = logs.flatMap((log) =>
    db
      .prepare("SELECT * FROM log_sets WHERE log_id=? ORDER BY position")
      .all(log.id)
      .map((set) => ({
        format_version: CSV_VERSION,
        workout_id: log.id,
        date: log.date,
        category: log.category,
        exercise: log.exercise,
        exercise_notes: log.exercise_notes,
        rep_min: log.rep_min,
        rep_max: log.rep_max,
        set_number: set.position,
        weight_kg: set.weight.toFixed(2),
        reps: set.reps,
        workout_notes: log.notes,
      })),
  );
  return encodeCsv(rows);
}
export function planImport(csv, userId) {
  const workouts = validateWorkouts(csv),
    newCategories = new Set(),
    newExercises = new Set();
  let skipped = 0,
    settingsKept = 0;
  const planned = workouts.map((workout) => {
    const digest = fingerprint(workout);
    const receipt = db
      .prepare(
        "SELECT * FROM workout_csv_receipts WHERE user_id=? AND source_id=?",
      )
      .get(userId, workout.sourceId);
    const existing = existingWorkout(
      receipt?.log_id || workout.sourceId,
      userId,
    );
    if (existing) {
      if ((receipt ? receipt.fingerprint : fingerprint(existing)) !== digest)
        throw new WorkoutCsvError(
          `Workout ${workout.sourceId} already exists with different content. Import never overwrites existing workouts; use a new workout_id only for a genuinely new workout.`,
        );
      skipped++;
      return { ...workout, digest, skip: true };
    }
    const category = db
      .prepare(
        "SELECT * FROM categories WHERE user_id=? AND name=? COLLATE NOCASE",
      )
      .get(userId, workout.category);
    const matches = category
      ? db
          .prepare(
            "SELECT * FROM exercises WHERE user_id=? AND category_id=? AND name=? COLLATE NOCASE",
          )
          .all(userId, category.id, workout.exercise)
      : [];
    if (matches.length > 1)
      throw new WorkoutCsvError(
        `“${workout.exercise}” is ambiguous in category “${workout.category}”. Rename duplicate exercises in your library before importing.`,
      );
    if (!category) newCategories.add(workout.category.toLowerCase());
    if (!matches.length)
      newExercises.add(
        JSON.stringify([
          workout.category.toLowerCase(),
          workout.exercise.toLowerCase(),
        ]),
      );
    const match = matches[0];
    if (
      match &&
      (match.notes !== workout.exercise_notes ||
        match.rep_min !== workout.rep_min ||
        match.rep_max !== workout.rep_max)
    )
      settingsKept++;
    return { ...workout, digest, skip: false };
  });
  const importing = planned.filter((workout) => !workout.skip);
  return {
    planned,
    summary: {
      workouts: workouts.length,
      importing: importing.length,
      skipped,
      sets: importing.reduce((sum, workout) => sum + workout.sets.length, 0),
      newCategories: newCategories.size,
      newExercises: newExercises.size,
      settingsKept,
      preview: importing.slice(0, 20).map((workout) => ({
        id: workout.sourceId,
        date: workout.date,
        category: workout.category,
        exercise: workout.exercise,
        sets: workout.sets.length,
      })),
    },
  };
}
export function importWorkouts(csv, userId) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const { planned, summary } = planImport(csv, userId);
    for (const workout of planned) {
      if (workout.skip) continue;
      let category = db
        .prepare(
          "SELECT id FROM categories WHERE user_id=? AND name=? COLLATE NOCASE",
        )
        .get(userId, workout.category);
      if (!category) {
        category = { id: randomUUID() };
        db.prepare("INSERT INTO categories VALUES(?,?,?)").run(
          category.id,
          userId,
          workout.category,
        );
      }
      let exercise = db
        .prepare(
          "SELECT id FROM exercises WHERE user_id=? AND category_id=? AND name=? COLLATE NOCASE",
        )
        .get(userId, category.id, workout.exercise);
      if (!exercise) {
        exercise = { id: randomUUID() };
        db.prepare(
          "INSERT INTO exercises(id,user_id,name,category,notes,ready,rep_min,rep_max,category_id) VALUES(?,?,?,?,?,0,?,?,?)",
        ).run(
          exercise.id,
          userId,
          workout.exercise,
          workout.category,
          workout.exercise_notes,
          workout.rep_min,
          workout.rep_max,
          category.id,
        );
      }
      const id = randomUUID(),
        best = workout.sets.reduce((a, b) => (b.weight > a.weight ? b : a));
      db.prepare("INSERT INTO logs VALUES(?,?,?,?,?,?,?)").run(
        id,
        userId,
        exercise.id,
        best.weight,
        best.reps,
        workout.date,
        workout.notes,
      );
      workout.sets.forEach((set, index) =>
        db
          .prepare(
            "INSERT INTO log_sets(log_id,position,weight,reps) VALUES(?,?,?,?)",
          )
          .run(id, index + 1, set.weight, set.reps),
      );
      db.prepare("INSERT INTO workout_csv_receipts VALUES(?,?,?,?)").run(
        userId,
        workout.sourceId,
        workout.digest,
        id,
      );
    }
    db.exec("COMMIT");
    return summary;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
