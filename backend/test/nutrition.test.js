import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { nutritionRoutes, nutritionDate } =
  await import("../src/features/nutrition/nutrition.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (
    !["nutrition-owner", "nutrition-other"].includes(req.headers["x-test-user"])
  )
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await nutritionRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/nutrition/target`;
for (const id of ["nutrition-owner", "nutrition-other"])
  await db
    .prepare(
      "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
async function request(method = "GET", body, user = "nutrition-owner") {
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
test("protein targets are owned, precise, and reflect only today's saved intake", async () => {
  assert.equal((await request("GET", undefined, null)).status, 401);
  assert.equal((await request()).data.target, null);
  for (const target of [0, 1001, 1.234, "100", null])
    assert.equal((await request("PUT", { target })).status, 400);
  assert.equal((await request("PUT", { target: 120.25 })).status, 200);
  assert.equal(
    (await request("GET", undefined, "nutrition-other")).data.target,
    null,
  );
  const today = nutritionDate();
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const insert = db.prepare(
    "INSERT INTO protein_entries(id,user_id,value,date,label,notes) VALUES(?,?,?,?,?,?)",
  );
  await insert.run("n1", "nutrition-owner", 25.12, today, "", "");
  await insert.run("n2", "nutrition-owner", 30.13, today, "", "");
  await insert.run(
    "n3",
    "nutrition-owner",
    999,
    yesterday.toISOString().slice(0, 10),
    "",
    "",
  );
  await insert.run("n4", "nutrition-other", 500, today, "", "");
  let result = (await request()).data;
  assert.deepEqual(result, {
    date: today,
    target: 120.25,
    logged: 55.25,
    remaining: 65,
  });
  await db.prepare("UPDATE protein_entries SET value=100 WHERE id='n2'").run();
  result = (await request()).data;
  assert.equal(result.logged, 125.12);
  assert.equal(result.remaining, 0);
  await db.prepare("DELETE FROM protein_entries WHERE id='n1'").run();
  assert.equal((await request()).data.logged, 100);
  result = (await request("DELETE")).data;
  assert.equal(result.target, null);
  assert.equal(result.remaining, null);
  assert.equal(result.logged, 100);
});
