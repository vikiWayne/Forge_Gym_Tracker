import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { workoutCsvRoutes } =
  await import("../src/features/workouts/workoutCsv.routes.js");
const { CSV_VERSION, encodeCsv, parseCsv } =
  await import("../src/features/workouts/workoutCsvFormat.js");
const app = express();
app.use((req, res, next) => {
  if (!req.headers["x-test-user"])
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
workoutCsvRoutes(app);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/workout-csv`;
for (const id of ["owner", "other"])
  db.prepare("INSERT INTO users(id,username,password,age,weight,sex) VALUES(?,?,?,?,?,?)").run(
    id,
    id,
    "not-used-by-test",
    30,
    70,
    "Other",
  );
async function request(path, user = "owner", csv) {
  const response = await fetch(base + path, {
    method: csv === undefined ? "GET" : "POST",
    headers: {
      ...(user ? { "x-test-user": user } : {}),
      ...(csv === undefined ? {} : { "content-type": "text/csv" }),
    },
    body: csv,
  });
  return {
    status: response.status,
    data: response.headers.get("content-type")?.includes("application/json")
      ? await response.json()
      : await response.text(),
  };
}
const row = (overrides = {}) => ({
  format_version: CSV_VERSION,
  workout_id: "source-workout-1",
  date: "2026-11-06",
  category: "Push",
  exercise: "Press",
  exercise_notes: "Brace",
  rep_min: 8,
  rep_max: 12,
  set_number: 1,
  weight_kg: "30.25",
  reps: 12,
  workout_notes: "Good session",
  ...overrides,
});
test("CSV preview/import/export round trip preserves sets and quoted text, remains user owned and idempotent", async () => {
  const notes = '=SUM(A1:A2), "quoted"\nsecond line';
  const csv = encodeCsv([
    row({
      category: "=Training",
      exercise: "'Quoted movement",
      workout_notes: notes,
    }),
    row({
      category: "=Training",
      exercise: "'Quoted movement",
      workout_notes: notes,
      set_number: 2,
      weight_kg: "40.50",
      reps: 8,
    }),
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.match(csv, /'=Training/);
  const parsed = parseCsv(csv);
  assert.equal(parsed[0].category, "=Training");
  assert.equal(parsed[0].exercise, "'Quoted movement");
  assert.equal(parsed[0].workout_notes, notes);
  assert.equal((await request("/export", null)).status, 401);
  const preview = await request("/preview", "owner", csv);
  assert.equal(preview.status, 200);
  assert.equal(preview.data.importing, 1);
  assert.equal(preview.data.sets, 2);
  assert.equal(preview.data.newCategories, 1);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM logs").get().n, 0);
  const imported = await request("/import", "owner", csv);
  assert.equal(imported.status, 200);
  assert.equal(imported.data.importing, 1);
  const log = db.prepare("SELECT * FROM logs WHERE user_id=?").get("owner");
  assert.equal(log.weight, 40.5);
  assert.equal(log.reps, 8);
  assert.equal(log.notes, notes);
  assert.deepEqual(
    db
      .prepare(
        "SELECT weight,reps FROM log_sets WHERE log_id=? ORDER BY position",
      )
      .all(log.id)
      .map((set) => ({ ...set })),
    [
      { weight: 30.25, reps: 12 },
      { weight: 40.5, reps: 8 },
    ],
  );
  const repeated = await request("/import", "owner", csv);
  assert.equal(repeated.data.importing, 0);
  assert.equal(repeated.data.skipped, 1);
  const exported = await request("/export");
  const decoded = parseCsv(exported.data);
  assert.equal(decoded.length, 2);
  assert.equal(decoded[0].workout_notes, notes);
  const ownExport = await request("/preview", "owner", exported.data);
  assert.equal(ownExport.data.skipped, 1);
  assert.equal((await request("/export", "other")).data, encodeCsv([]).replace(/^\uFEFF/, ""));
});
test("invalid files and conflicting IDs fail atomically; another account can import its own copy", async () => {
  const valid = encodeCsv([
    row({ workout_id: "atomic-valid" }),
    row({ workout_id: "atomic-invalid", weight_kg: "1.234" }),
  ]);
  const before = db.prepare("SELECT COUNT(*) AS n FROM logs").get().n;
  assert.equal((await request("/import", "owner", valid)).status, 400);
  assert.equal(db.prepare("SELECT COUNT(*) AS n FROM logs").get().n, before);
  for (const csv of [
    encodeCsv([row({ workout_id: "gap", set_number: 2 })]),
    encodeCsv([
      row({ workout_id: "duplicate" }),
      row({ workout_id: "duplicate" }),
    ]),
    encodeCsv([row({ workout_id: "bad-date", date: "2026-02-30" })]),
    "a,b\n1,2",
    '"unclosed',
  ])
    assert.equal((await request("/preview", "owner", csv)).status, 400);
  const conflict = encodeCsv([
    row({ workout_id: "source-workout-1", workout_notes: "Changed" }),
  ]);
  assert.equal((await request("/import", "owner", conflict)).status, 400);
  const copy = encodeCsv([row({ workout_id: "source-workout-1" })]);
  assert.equal((await request("/import", "other", copy)).data.importing, 1);
  const settings = db
    .prepare("SELECT COUNT(*) AS n FROM exercises WHERE user_id=?")
    .get("other").n;
  assert.equal(settings, 1);
});
