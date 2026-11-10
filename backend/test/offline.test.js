import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { workoutRoutes } =
  await import("../src/features/workouts/workouts.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  req.userId = req.headers["x-test-user"] || "offline-owner";
  next();
});
workoutRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
for (const id of ["offline-owner", "offline-other"])
  db.prepare(
    "INSERT INTO users(id,username,password,age,weight,sex) VALUES(?,?,?,?,?,?)",
  ).run(id, id, "unused", 30, 70, "Other");
const exercise = randomUUID();
db.prepare(
  "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
).run(exercise, "offline-owner", "Press", "Push", "");
const base = `http://127.0.0.1:${server.address().port}/api/logs`;
async function post(body, user = "offline-owner") {
  const response = await fetch(base, {
    method: "POST",
    headers: { "content-type": "application/json", "x-test-user": user },
    body: JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
test("offline replay is idempotent, owned, and rejects changed payloads", async () => {
  const body = {
    client_id: randomUUID(),
    exercise_id: exercise,
    sets: [{ weight: 40, reps: 8 }],
    date: "2026-11-06",
    notes: "Saved while offline",
  };
  const first = await post(body);
  assert.equal(first.status, 201);
  const retry = await post(body);
  assert.equal(retry.status, 200);
  assert.equal(retry.data.id, first.data.id);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM logs").get().count, 1);
  assert.equal((await post({ ...body, notes: "Changed" })).status, 409);
  assert.equal((await post(body, "offline-other")).status, 400);
  assert.equal((await post({ ...body, client_id: "bad" })).status, 400);
  db.prepare("DELETE FROM logs WHERE id=?").run(first.data.id);
  assert.equal(
    db.prepare("SELECT COUNT(*) AS count FROM offline_workout_receipts").get()
      .count,
    0,
  );
});
