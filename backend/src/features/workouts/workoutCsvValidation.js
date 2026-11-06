import { dateSchema, liftWeightSchema } from "../../shared/validation.js";
import { CSV_VERSION, parseCsv, WorkoutCsvError } from "./workoutCsvFormat.js";
function fail(record, message) {
  throw new WorkoutCsvError(`CSV record ${record}: ${message}`);
}
function integer(value, min, max, record, label) {
  if (!/^\d+$/.test(value) || Number(value) < min || Number(value) > max)
    fail(record, `${label} must be an integer from ${min} to ${max}.`);
  return Number(value);
}
export function validateWorkouts(csv) {
  const rows = parseCsv(csv),
    workouts = new Map(),
    definitions = new Map();
  rows.forEach((row, index) => {
    const record = index + 2;
    if (row.format_version !== CSV_VERSION)
      fail(record, `format_version must be ${CSV_VERSION}.`);
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(row.workout_id))
      fail(
        record,
        "workout_id must contain 1–80 letters, numbers, underscores or hyphens.",
      );
    if (!dateSchema.safeParse(row.date).success)
      fail(record, "date must be a valid YYYY-MM-DD date.");
    const category = row.category.trim(),
      exercise = row.exercise.trim();
    if (!category || category.length > 50)
      fail(record, "category must contain 1–50 characters.");
    if (!exercise || exercise.length > 80)
      fail(record, "exercise must contain 1–80 characters.");
    if (row.exercise_notes.length > 1000 || row.workout_notes.length > 1000)
      fail(record, "notes must be 1,000 characters or fewer.");
    const rep_min = integer(row.rep_min, 1, 1000, record, "rep_min"),
      rep_max = integer(row.rep_max, 1, 1000, record, "rep_max");
    if (rep_min > rep_max) fail(record, "rep_min cannot exceed rep_max.");
    const position = integer(row.set_number, 1, 50, record, "set_number");
    if (
      !/^\d+(?:\.\d{1,2})?$/.test(row.weight_kg) ||
      !liftWeightSchema.safeParse(Number(row.weight_kg)).success
    )
      fail(record, "weight_kg must be 0–1500 with at most 2 decimal places.");
    const reps = integer(row.reps, 1, 1000, record, "reps");
    const metadata = {
      date: row.date,
      category,
      exercise,
      exercise_notes: row.exercise_notes,
      rep_min,
      rep_max,
      notes: row.workout_notes,
    };
    const definitionKey = JSON.stringify([
      category.toLowerCase(),
      exercise.toLowerCase(),
    ]);
    const definition = JSON.stringify([row.exercise_notes, rep_min, rep_max]);
    if (
      definitions.has(definitionKey) &&
      definitions.get(definitionKey) !== definition
    )
      fail(
        record,
        "the same category/exercise has inconsistent exercise notes or rep ranges.",
      );
    definitions.set(definitionKey, definition);
    let workout = workouts.get(row.workout_id);
    if (!workout) {
      workout = { sourceId: row.workout_id, ...metadata, positions: new Map() };
      workouts.set(row.workout_id, workout);
    } else if (
      JSON.stringify(metadata) !==
      JSON.stringify({
        date: workout.date,
        category: workout.category,
        exercise: workout.exercise,
        exercise_notes: workout.exercise_notes,
        rep_min: workout.rep_min,
        rep_max: workout.rep_max,
        notes: workout.notes,
      })
    )
      fail(
        record,
        "rows with the same workout_id must have identical date, exercise, category and notes.",
      );
    if (workout.positions.has(position))
      fail(
        record,
        `set ${position} is repeated for workout ${row.workout_id}.`,
      );
    workout.positions.set(position, { weight: Number(row.weight_kg), reps });
  });
  return Array.from(workouts.values(), (workout) => {
    const positions = Array.from(workout.positions.keys()).sort(
      (a, b) => a - b,
    );
    if (positions.some((position, index) => position !== index + 1))
      throw new WorkoutCsvError(
        `Workout ${workout.sourceId}: set numbers must start at 1 with no gaps.`,
      );
    const { positions: unused, ...result } = workout;
    return {
      ...result,
      sets: positions.map((position) => workout.positions.get(position)),
    };
  });
}
