import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { goalsRoutes, goalWeek } =
  await import("../src/features/goals/goals.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!["goal-owner", "goal-other"].includes(req.headers["x-test-user"]))
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
goalsRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/goals/weekly`;
for (const id of ["goal-owner", "goal-other"])
  db.prepare(
    "INSERT INTO users(id,username,password,age,weight,sex) VALUES(?,?,?,?,?,?)",
  ).run(id, id, "unused", 30, 70, "Other");
db.prepare(
  "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
).run("goal-exercise", "goal-owner", "Press", "Push", "");
async function request(method = "GET", body, user = "goal-owner") {
  const response = await fetch(base, {
    method,
    headers: {
      "content-type": "application/json",
      ...(user ? { "x-test-user": user } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json() };
}
test("weekly goals use Monday-Sunday boundaries across years", () => {
  assert.deepEqual(goalWeek("2027-01-01"), {
    today: "2027-01-01",
    start: "2026-12-28",
    end: "2027-01-03",
  });
  assert.equal(goalWeek("2026-11-08").start, "2026-11-02");
  assert.equal(goalWeek("2026-11-09").start, "2026-11-09");
});
test("weekly target is owned, validates range, counts a workout date once, and recalculates", async () => {
  assert.equal((await request("GET", undefined, null)).status, 401);
  assert.equal((await request()).data.target, null);
  for (const target of [0, 8, 1.5, "3"])
    assert.equal((await request("PUT", { target })).status, 400);
  const saved = await request("PUT", { target: 3 });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.target, 3);
  assert.equal(
    (await request("GET", undefined, "goal-other")).data.target,
    null,
  );
  const week = goalWeek();
  const insert = db.prepare(
    "INSERT INTO logs(id,user_id,exercise_id,weight,reps,date,notes) VALUES(?,?,?,?,?,?,?)",
  );
  insert.run(
    "goal-log-1",
    "goal-owner",
    "goal-exercise",
    30,
    8,
    week.today,
    "",
  );
  insert.run(
    "goal-log-2",
    "goal-owner",
    "goal-exercise",
    40,
    8,
    week.today,
    "",
  );
  const old = new Date(`${week.start}T12:00:00Z`);
  old.setUTCDate(old.getUTCDate() - 1);
  insert.run(
    "goal-log-old",
    "goal-owner",
    "goal-exercise",
    20,
    8,
    old.toISOString().slice(0, 10),
    "",
  );
  let result = (await request()).data;
  assert.equal(result.completed, 1);
  assert.deepEqual(result.dates, [week.today]);
  assert.equal(
    (await request("GET", undefined, "goal-other")).data.completed,
    0,
  );
  db.prepare("DELETE FROM logs WHERE id IN ('goal-log-1','goal-log-2')").run();
  result = (await request()).data;
  assert.equal(result.completed, 0);
  assert.equal((await request("DELETE")).data.target, null);
});
