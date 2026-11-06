import { createHash } from "node:crypto";
export const CSV_VERSION = "forge-workouts-v1";
export const CSV_COLUMNS = [
  "format_version",
  "workout_id",
  "date",
  "category",
  "exercise",
  "exercise_notes",
  "rep_min",
  "rep_max",
  "set_number",
  "weight_kg",
  "reps",
  "workout_notes",
];
const textColumns = new Set([
  "category",
  "exercise",
  "exercise_notes",
  "workout_notes",
]);
export class WorkoutCsvError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}
export function escapeText(value) {
  const text = String(value ?? "");
  return text.startsWith("'") || /^\s*[=+\-@\t\r]/.test(text)
    ? "'" + text
    : text;
}
export function unescapeText(value) {
  return value.startsWith("'") ? value.slice(1) : value;
}
export function encodeCsv(rows) {
  return (
    "\uFEFF" +
    [
      CSV_COLUMNS,
      ...rows.map((row) =>
        CSV_COLUMNS.map((column) =>
          textColumns.has(column)
            ? escapeText(row[column])
            : String(row[column] ?? ""),
        ),
      ),
    ]
      .map((row) =>
        row
          .map((cell) => '"' + String(cell).replaceAll('"', '""') + '"')
          .join(","),
      )
      .join("\r\n") +
    "\r\n"
  );
}
export function parseCsv(input) {
  if (typeof input !== "string" || !input.trim())
    throw new WorkoutCsvError("Choose a non-empty CSV file.");
  if (Buffer.byteLength(input, "utf8") > 2 * 1024 * 1024)
    throw new WorkoutCsvError("CSV files must be 2 MiB or smaller.");
  if (/[\0\uFFFD]/.test(input))
    throw new WorkoutCsvError(
      "Use a UTF-8 CSV file without invalid characters.",
    );
  const text = input.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [],
    cell = "",
    quoted = false,
    closed = false;
  const finishCell = () => {
    row.push(cell);
    cell = "";
    closed = false;
  };
  const finishRow = () => {
    finishCell();
    if (row.some((value) => value !== "")) rows.push(row);
    row = [];
    if (rows.length > 10001)
      throw new WorkoutCsvError("Import at most 10,000 set rows at a time.");
  };
  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (quoted) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index++;
        } else {
          quoted = false;
          closed = true;
        }
      } else cell += char;
      continue;
    }
    if (char === ",") {
      finishCell();
      continue;
    }
    if (char === "\r" || char === "\n") {
      if (char === "\r" && text[index + 1] === "\n") index++;
      finishRow();
      continue;
    }
    if (closed)
      throw new WorkoutCsvError(
        `CSV record ${rows.length + 1}: unexpected text after a closing quote.`,
      );
    if (char === '"') {
      if (cell)
        throw new WorkoutCsvError(
          `CSV record ${rows.length + 1}: quote must start a field.`,
        );
      quoted = true;
    } else cell += char;
  }
  if (quoted)
    throw new WorkoutCsvError("The CSV contains an unclosed quoted field.");
  if (cell || row.length || closed) finishRow();
  const header = rows.shift();
  if (
    !header ||
    header.length !== CSV_COLUMNS.length ||
    header.some((column, index) => column !== CSV_COLUMNS[index])
  )
    throw new WorkoutCsvError(
      `Use the FORGE CSV columns in this order: ${CSV_COLUMNS.join(", ")}. Export an empty journal for a header-only template.`,
    );
  if (!rows.length)
    throw new WorkoutCsvError("The CSV has a header but no workout sets.");
  return rows.map((values, index) => {
    if (values.length !== CSV_COLUMNS.length)
      throw new WorkoutCsvError(
        `CSV record ${index + 2}: expected ${CSV_COLUMNS.length} fields.`,
      );
    return Object.fromEntries(
      CSV_COLUMNS.map((column, position) => [
        column,
        textColumns.has(column)
          ? unescapeText(values[position])
          : values[position],
      ]),
    );
  });
}
export function fingerprint(workout) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        date: workout.date,
        category: workout.category.toLowerCase(),
        exercise: workout.exercise.toLowerCase(),
        notes: workout.notes,
        sets: workout.sets,
      }),
    )
    .digest("hex");
}
