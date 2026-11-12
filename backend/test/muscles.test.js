import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { musclesRoutes } =
  await import("../src/features/muscles/muscles.routes.js");
const { goalWeek } = await import("../src/features/goals/goals.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!["muscle-owner", "muscle-other"].includes(req.headers["x-test-user"]))
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await musclesRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/muscles`;
for (const id of ["muscle-owner", "muscle-other"])
  await db
    .prepare(
      "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
for (const [id, owner] of [
  ["press", "muscle-owner"],
  ["row", "muscle-other"],
  ["untagged", "muscle-owner"],
])
  await db
    .prepare(
      "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
    )
    .run(id, owner, id, "Training", "");
async function request(path = "", body, user = "muscle-owner") {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "PUT",
    headers: {
      "content-type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
test("muscle tags are owned, validated, count each saved set per tag and recalculate", async () => {
  assert.equal((await request("", undefined, null)).status, 401);
  assert.equal(
    (await request("/exercises/row", { muscles: ["Back"] })).status,
    404,
  );
  assert.equal(
    (await request("/exercises/press", { muscles: ["Unknown"] })).status,
    400,
  );
  assert.equal(
    (
      await request("/exercises/press", {
        muscles: ["Chest", "Triceps", "Chest"],
      })
    ).status,
    200,
  );
  const week = goalWeek();
  const old = new Date(`${week.start}T12:00:00Z`);
  old.setUTCDate(old.getUTCDate() - 1);
  const future = new Date(`${week.today}T12:00:00Z`);
  future.setUTCDate(future.getUTCDate() + 1);
  for (const [id, owner, exercise, date, count] of [
    ["press1", "muscle-owner", "press", week.today, 2],
    ["press2", "muscle-owner", "press", week.today, 1],
    ["old", "muscle-owner", "press", old.toISOString().slice(0, 10), 4],
    ["future", "muscle-owner", "press", future.toISOString().slice(0, 10), 4],
    ["unassigned", "muscle-owner", "untagged", week.today, 1],
    ["other", "muscle-other", "row", week.today, 5],
  ]) {
    await db
      .prepare(
        "INSERT INTO logs(id,user_id,exercise_id,weight,reps,date,notes) VALUES(?,?,?,?,?,?,?)",
      )
      .run(id, owner, exercise, 30, 8, date, "");
    for (let index = 1; index <= count; index++)
      await db
        .prepare(
          "INSERT INTO log_sets(log_id,position,weight,reps) VALUES(?,?,?,?)",
        )
        .run(id, index, 30, 8);
  }
  let result = (await request()).data;
  assert.equal(result.summary.find((row) => row.muscle === "Chest").sets, 3);
  assert.equal(result.summary.find((row) => row.muscle === "Triceps").sets, 3);
  assert.equal(result.untagged_sets, 1);
  assert.equal(result.exercises.length, 2);
  assert.deepEqual(result.exercises.find((row) => row.id === "press").muscles, [
    "Chest",
    "Triceps",
  ]);
  assert.equal(
    (await request("", undefined, "muscle-other")).data.summary.every(
      (row) => row.sets === 0,
    ),
    true,
  );
  await request("/exercises/press", { muscles: ["Shoulders"] });
  result = (await request()).data;
  assert.equal(result.summary.find((row) => row.muscle === "Chest").sets, 0);
  assert.equal(
    result.summary.find((row) => row.muscle === "Shoulders").sets,
    3,
  );
  await db.prepare("DELETE FROM logs WHERE id='press1'").run();
  assert.equal(
    (await request()).data.summary.find((row) => row.muscle === "Shoulders")
      .sets,
    1,
  );
  await request("/exercises/press", { muscles: [] });
  assert.equal((await request()).data.untagged_sets, 2);
});
