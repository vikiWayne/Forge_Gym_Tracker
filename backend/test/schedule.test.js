import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { scheduleRoutes } =
  await import("../src/features/schedule/schedule.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!req.headers["x-test-user"])
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
scheduleRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/schedule`;
const owner = randomUUID(),
  other = randomUUID(),
  routine = randomUUID(),
  foreignRoutine = randomUUID(),
  exercise = randomUUID(),
  log = randomUUID();
for (const id of [owner, other])
  db.prepare(
    "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
  ).run(id, id, "unused", 30, 70, "Other", `${id}@example.test`);
db.prepare(
  "INSERT INTO routines(id,user_id,name,notes,exercises) VALUES(?,?,?,?,?)",
).run(routine, owner, "Push day", "", "[]");
db.prepare(
  "INSERT INTO routines(id,user_id,name,notes,exercises) VALUES(?,?,?,?,?)",
).run(foreignRoutine, other, "Private routine", "", "[]");
db.prepare(
  "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
).run(exercise, owner, "Press", "Push", "");
db.prepare(
  "INSERT INTO logs(id,user_id,exercise_id,weight,reps,date,notes) VALUES(?,?,?,?,?,?,?)",
).run(log, owner, exercise, 30, 10, "2026-11-06", "");
async function request(path = "", method = "GET", body, user = owner) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
test("schedule supports future planning, owned CRUD and explicit completed-work links", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  const future = {
    routine_id: routine,
    date: "2030-01-10",
    notes: "After work",
  };
  assert.equal(
    (await request("", "POST", { ...future, routine_id: foreignRoutine }))
      .status,
    400,
  );
  assert.equal(
    (await request("", "POST", { ...future, date: "2026-02-30" })).status,
    400,
  );
  const created = await request("", "POST", future);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.equal((await request()).data.entries[0].routine_name, "Push day");
  assert.deepEqual(
    (await request("", "GET", undefined, other)).data.entries,
    [],
  );
  assert.equal((await request(`/${id}`, "PUT", future, other)).status, 404);
  assert.equal(
    (await request(`/${id}/completion`, "POST", { log_id: log })).status,
    400,
  );
  assert.equal(
    (await request(`/${id}`, "PUT", { ...future, date: "2026-11-06" })).status,
    200,
  );
  assert.equal((await request()).data.entries[0].logged_workouts, 1);
  assert.equal(
    (await request(`/${id}/completion`, "POST", { log_id: log }, other)).status,
    404,
  );
  assert.equal(
    (await request(`/${id}/completion`, "POST", { log_id: log })).status,
    200,
  );
  assert.ok((await request()).data.entries[0].completed_at);
  assert.equal((await request(`/${id}`, "PUT", future)).status, 409);
  const duplicate = await request("", "POST", {
    ...future,
    date: "2026-11-06",
  });
  assert.equal(
    (await request(`/${duplicate.data.id}/completion`, "POST", { log_id: log }))
      .status,
    409,
  );
  assert.equal((await request(`/${id}/completion`, "DELETE")).status, 200);
  assert.equal(
    (await request(`/${duplicate.data.id}/completion`, "POST", { log_id: log }))
      .status,
    200,
  );
  assert.equal(
    (await request(`/${id}`, "DELETE", undefined, other)).status,
    404,
  );
  assert.equal((await request(`/${id}`, "DELETE")).status, 200);
  // Deleting a routine preserves dated plans without blocking deletion.
  db.prepare("DELETE FROM routines WHERE id=?").run(routine);
  const retained = (await request()).data.entries[0];
  assert.equal(retained.routine_id, null);
  assert.equal(retained.routine_name, "Push day");
  assert.equal((await request(`/${retained.id}`, "DELETE")).status, 200);
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM logs").get().count, 1);
});
