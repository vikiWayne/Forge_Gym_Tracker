import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { sharedRoutineRoutes } =
  await import("../src/features/plans/sharedRoutines.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!req.headers["x-test-user"])
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await sharedRoutineRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const owner = randomUUID(),
  partner = randomUUID(),
  pending = randomUUID(),
  outsider = randomUUID();
const plan = randomUUID(),
  category = randomUUID(),
  exercise = randomUUID(),
  routine = randomUUID();
for (const [id, username] of [
  [owner, "author"],
  [partner, "partner"],
  [pending, "pending"],
  [outsider, "outsider"],
])
  await db
    .prepare(
      "INSERT INTO users(id,username,email,password,age,weight,sex) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, username, `${username}@example.com`, "unused", 30, 70, "Other");
await db
  .prepare("INSERT INTO plans(id,name,owner_id) VALUES(?,?,?)")
  .run(plan, "Crew", owner);
for (const [user, accepted] of [
  [owner, 1],
  [partner, 1],
  [pending, 0],
])
  await db
    .prepare("INSERT INTO members(plan_id,user_id,accepted) VALUES(?,?,?)")
    .run(plan, user, accepted);
await db
  .prepare("INSERT INTO categories(id,user_id,name) VALUES(?,?,?)")
  .run(category, owner, "Push");
await db
  .prepare(
    "INSERT INTO exercises(id,user_id,name,category,category_id,notes,rep_min,rep_max,ready) VALUES(?,?,?,?,?,?,?,?,?)",
  )
  .run(exercise, owner, "Press", "Push", category, "Brace carefully", 8, 12, 0);
await db
  .prepare(
    "INSERT INTO routines(id,user_id,name,notes,exercises) VALUES(?,?,?,?,?)",
  )
  .run(
    routine,
    owner,
    "Push day",
    "Routine note",
    JSON.stringify([
      { exercise_id: exercise, sets: [{ weight: 30, reps: 8 }] },
    ]),
  );
async function request(path = "", method = "GET", body, user = owner) {
  const response = await fetch(
    `http://127.0.0.1:${server.address().port}/api/plans/${plan}/routines${path}`,
    {
      method,
      headers: {
        "content-type": "application/json",
        ...(user ? { "x-test-user": user } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
  );
  return { status: response.status, data: await response.json() };
}
test("routine sharing requires consent and accepted membership; imports independent owned copies", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  assert.equal((await request("", "GET", undefined, pending)).status, 404);
  assert.equal((await request("", "GET", undefined, outsider)).status, 404);
  assert.equal(
    (await request("", "POST", { routine_id: routine }, owner)).status,
    400,
  );
  assert.equal(
    (
      await request(
        "",
        "POST",
        { routine_id: routine, include_notes: true },
        partner,
      )
    ).status,
    404,
  );
  const shared = await request("", "POST", {
    routine_id: routine,
    include_notes: true,
  });
  assert.equal(shared.status, 201);
  const shareId = shared.data.id;
  const listing = (await request("", "GET", undefined, partner)).data;
  assert.equal(listing[0].username, "author");
  assert.equal(listing[0].notes, "Routine note");
  assert.equal(listing[0].exercises[0].notes, "Brace carefully");
  assert.ok(!JSON.stringify(listing).includes("@example.com"));
  assert.ok(!JSON.stringify(listing).includes(exercise));
  const imported = await request(`/${shareId}/import`, "POST", {}, partner);
  assert.equal(imported.status, 200);
  const copy = await db
    .prepare("SELECT * FROM routines WHERE id=?")
    .get(imported.data.id);
  assert.equal(copy.user_id, partner);
  const copiedExerciseId = JSON.parse(copy.exercises)[0].exercise_id;
  assert.notEqual(copiedExerciseId, exercise);
  assert.equal(
    (
      await db
        .prepare("SELECT user_id FROM exercises WHERE id=?")
        .get(copiedExerciseId)
    ).user_id,
    partner,
  );
  const repeated = await request(`/${shareId}/import`, "POST", {}, partner);
  assert.equal(repeated.data.id, copy.id);
  assert.equal(repeated.data.already_imported, true);
  await db
    .prepare("UPDATE routines SET name='Edited source' WHERE id=?")
    .run(routine);
  assert.equal(
    (await request("", "GET", undefined, partner)).data[0].name,
    "Push day",
  );
  assert.equal(
    (await db.prepare("SELECT name FROM routines WHERE id=?").get(copy.id))
      .name,
    "Push day",
  );
  assert.equal(
    (await request(`/${shareId}`, "DELETE", undefined, partner)).status,
    404,
  );
  await db
    .prepare("DELETE FROM members WHERE plan_id=? AND user_id=?")
    .run(plan, partner);
  assert.equal(
    (await request(`/${shareId}/import`, "POST", {}, partner)).status,
    404,
  );
  assert.equal(
    (await db.prepare("SELECT name FROM routines WHERE id=?").get(copy.id))
      .name,
    "Push day",
  );
  assert.equal((await request(`/${shareId}`, "DELETE")).status, 200);
  assert.equal(
    (await db.prepare("SELECT name FROM routines WHERE id=?").get(copy.id))
      .name,
    "Push day",
  );
});
