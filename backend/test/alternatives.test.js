import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { alternativesRoutes } =
  await import("../src/features/alternatives/alternatives.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (!req.headers["x-test-user"])
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await alternativesRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/alternatives`;
const owner = randomUUID(),
  other = randomUUID(),
  first = randomUUID(),
  second = randomUUID(),
  foreign = randomUUID();
for (const id of [owner, other])
  await db
    .prepare(
      "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
for (const [id, user, name] of [
  [first, owner, "Barbell press"],
  [second, owner, "Dumbbell press"],
  [foreign, other, "Other press"],
])
  await db
    .prepare(
      "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
    )
    .run(id, user, name, "Push", "");
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
test("alternative links are mutual, owned, unique and removed with deleted exercises", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  assert.equal(
    (await request("", "POST", { exercise_a: first, exercise_b: first }))
      .status,
    400,
  );
  assert.equal(
    (await request("", "POST", { exercise_a: first, exercise_b: foreign }))
      .status,
    400,
  );
  assert.equal(
    (
      await request("", "POST", {
        exercise_a: first,
        exercise_b: second,
        note: "x".repeat(501),
      })
    ).status,
    400,
  );
  const saved = await request("", "POST", {
    exercise_a: first,
    exercise_b: second,
    note: "Use when bench is busy",
  });
  assert.equal(saved.status, 201);
  assert.equal(
    (await request("", "POST", { exercise_a: second, exercise_b: first }))
      .status,
    409,
  );
  assert.equal(
    (await request(`?exercise_id=${first}`)).data.alternatives.length,
    1,
  );
  assert.equal(
    (await request(`?exercise_id=${second}`)).data.alternatives.length,
    1,
  );
  assert.equal(
    (await request("", "GET", undefined, other)).data.alternatives.length,
    0,
  );
  assert.equal(
    (await request(`/${saved.data.id}`, "PATCH", { note: "Changed" }, other))
      .status,
    404,
  );
  assert.equal(
    (await request(`/${saved.data.id}`, "DELETE", undefined, other)).status,
    404,
  );
  assert.equal(
    (
      await request(`/${saved.data.id}`, "PATCH", {
        note: "Cable station alternative",
      })
    ).status,
    200,
  );
  assert.equal(
    (await request()).data.alternatives[0].note,
    "Cable station alternative",
  );
  await db.prepare("DELETE FROM exercises WHERE id=?").run(first);
  assert.deepEqual((await request()).data.alternatives, []);
  assert.equal(
    (
      await db
        .prepare("SELECT COUNT(*) AS count FROM exercises WHERE user_id=?")
        .get(owner)
    ).count,
    1,
  );
  const third = randomUUID();
  await db
    .prepare(
      "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
    )
    .run(third, owner, "Machine press", "Push", "");
  const next = await request("", "POST", {
    exercise_a: second,
    exercise_b: third,
  });
  assert.equal((await request(`/${next.data.id}`, "DELETE")).status, 200);
  assert.equal((await request()).data.alternatives.length, 0);
});
