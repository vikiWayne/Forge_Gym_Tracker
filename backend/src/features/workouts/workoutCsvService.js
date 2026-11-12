import { randomUUID } from "node:crypto";
import { db } from "../../database/connection.js";
import {
  CSV_VERSION,
  encodeCsv,
  fingerprint,
  WorkoutCsvError,
} from "./workoutCsvFormat.js";
import { validateWorkouts } from "./workoutCsvValidation.js";
import { setInserts } from "./saveSets.js";
import { withSets } from "./serialize.js";
export async function initializeCsvImports() {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS workout_csv_receipts(user_id TEXT NOT NULL REFERENCES users(id),source_id TEXT NOT NULL,fingerprint TEXT NOT NULL,log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,source_id))",
  );
}
export async function exportWorkouts(userId) {
  const sets = await db
    .prepare(
      `SELECT l.id,l.date,l.notes,e.name AS exercise,e.category,e.notes AS exercise_notes,
       e.rep_min,e.rep_max,s.position,s.weight,s.reps
       FROM logs l JOIN exercises e ON e.id=l.exercise_id
       JOIN log_sets s ON s.log_id=l.id WHERE l.user_id=? ORDER BY l.date,l.rowid,s.position`,
    )
    .all(userId);
  return encodeCsv(
    sets.map((set) => ({
      format_version: CSV_VERSION,
      workout_id: set.id,
      date: set.date,
      category: set.category,
      exercise: set.exercise,
      exercise_notes: set.exercise_notes,
      rep_min: set.rep_min,
      rep_max: set.rep_max,
      set_number: set.position,
      weight_kg: set.weight.toFixed(2),
      reps: set.reps,
      workout_notes: set.notes,
    })),
  );
}

// SQLite NOCASE folds only ASCII letters.
const fold = (name) => name.replace(/[A-Z]/g, (letter) => letter.toLowerCase());
const exerciseKey = (categoryId, name) =>
  JSON.stringify([categoryId, fold(name)]);

export async function planImport(csv, userId) {
  const workouts = validateWorkouts(csv),
    newCategories = new Set(),
    newExercises = new Set();
  const sourceIds = JSON.stringify(workouts.map((workout) => workout.sourceId));
  const receipts = new Map(
    (
      await db
        .prepare(
          "SELECT * FROM workout_csv_receipts WHERE user_id=? AND source_id IN (SELECT value FROM json_each(?))",
        )
        .all(userId, sourceIds)
    ).map((receipt) => [receipt.source_id, receipt]),
  );
  const logIds = JSON.stringify(
    workouts.map(({ sourceId }) => receipts.get(sourceId)?.log_id ?? sourceId),
  );
  const existingLogs = new Map(
    (
      await withSets(
        await db
          .prepare(
            `SELECT l.*,e.name AS exercise,e.category FROM logs l JOIN exercises e ON e.id=l.exercise_id
     WHERE l.user_id=? AND l.id IN (SELECT value FROM json_each(?))`,
          )
          .all(userId, logIds),
      )
    ).map((log) => [log.id, log]),
  );
  const categories = new Map(
    (
      await db
        .prepare("SELECT id,name FROM categories WHERE user_id=?")
        .all(userId)
    ).map((category) => [fold(category.name), category]),
  );
  const exercises = new Map();
  for (const row of await db
    .prepare("SELECT * FROM exercises WHERE user_id=?")
    .all(userId)) {
    const key = exerciseKey(row.category_id, row.name);
    if (!exercises.has(key)) exercises.set(key, []);
    exercises.get(key).push(row);
  }
  let skipped = 0,
    settingsKept = 0;
  const planned = workouts.map((workout) => {
    const digest = fingerprint(workout);
    const receipt = receipts.get(workout.sourceId);
    const existing = existingLogs.get(receipt?.log_id ?? workout.sourceId);
    if (existing) {
      const savedFingerprint =
        receipt?.fingerprint ??
        fingerprint({
          ...existing,
          sets: existing.sets.map(({ weight, reps }) => ({ weight, reps })),
        });
      if (savedFingerprint !== digest)
        throw new WorkoutCsvError(
          `Workout ${workout.sourceId} already exists with different content. Import never overwrites existing workouts; use a new workout_id only for a genuinely new workout.`,
        );
      skipped++;
      return { ...workout, digest, skip: true };
    }
    const category = categories.get(fold(workout.category));
    const matches = category
      ? (exercises.get(exerciseKey(category.id, workout.exercise)) ?? [])
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
    categories,
    exercises,
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
export async function importWorkouts(csv, userId) {
  return await db.transaction(async () => {
    const { planned, summary, categories, exercises } = await planImport(
      csv,
      userId,
    );
    const statements = [];
    for (const workout of planned) {
      if (workout.skip) continue;
      const categoryKey = fold(workout.category);
      let category = categories.get(categoryKey);
      if (!category) {
        category = { id: randomUUID() };
        categories.set(categoryKey, category);
        statements.push({
          sql: "INSERT INTO categories VALUES(?,?,?)",
          args: [category.id, userId, workout.category],
        });
      }
      const key = exerciseKey(category.id, workout.exercise);
      let exercise = exercises.get(key)?.[0];
      if (!exercise) {
        exercise = { id: randomUUID() };
        exercises.set(key, [exercise]);
        statements.push({
          sql: "INSERT INTO exercises(id,user_id,name,category,notes,ready,rep_min,rep_max,category_id) VALUES(?,?,?,?,?,0,?,?,?)",
          args: [
            exercise.id,
            userId,
            workout.exercise,
            workout.category,
            workout.exercise_notes,
            workout.rep_min,
            workout.rep_max,
            category.id,
          ],
        });
      }
      const id = randomUUID(),
        best = workout.sets.reduce((a, b) => (b.weight > a.weight ? b : a));
      statements.push(
        {
          sql: "INSERT INTO logs VALUES(?,?,?,?,?,?,?)",
          args: [
            id,
            userId,
            exercise.id,
            best.weight,
            best.reps,
            workout.date,
            workout.notes,
          ],
        },
        ...setInserts(id, workout.sets),
        {
          sql: "INSERT INTO workout_csv_receipts VALUES(?,?,?,?)",
          args: [userId, workout.sourceId, workout.digest, id],
        },
      );
    }
    for (let start = 0; start < statements.length; start += 200)
      await db.batch(statements.slice(start, start + 200));
    return summary;
  });
}
