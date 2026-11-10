import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { recoveryRoutes } =
  await import("../src/features/recovery/recovery.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (
    !["recovery-owner", "recovery-other"].includes(req.headers["x-test-user"])
  )
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
recoveryRoutes(app);
app.use(errorHandler);
for (const id of ["recovery-owner", "recovery-other"])
  db.prepare(
    "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
  ).run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/recovery`;
async function request(
  path = "",
  method = "GET",
  body,
  user = "recovery-owner",
) {
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
test("recovery journal is private, one entry per date, with validated sleep and ratings", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  const payload = {
    date: "2026-11-06",
    sleep_hours: 7.25,
    energy: 4,
    soreness: 2,
    mood: 4,
    notes: "Steady day",
  };
  const created = await request("", "POST", payload);
  assert.equal(created.status, 201);
  assert.equal((await request("", "POST", payload)).status, 409);
  assert.equal(
    (await request("", "GET", undefined, "recovery-other")).data.entries.length,
    0,
  );
  assert.equal(
    (await request(`/${created.data.id}`, "PUT", payload, "recovery-other"))
      .status,
    404,
  );
  assert.equal(
    (
      await request(
        `/${created.data.id}`,
        "DELETE",
        undefined,
        "recovery-other",
      )
    ).status,
    404,
  );
  for (const changes of [
    { sleep_hours: -1 },
    { sleep_hours: 24.01 },
    { sleep_hours: 7.251 },
    { energy: 0 },
    { energy: 6 },
    { soreness: 1.5 },
    { mood: 6 },
    { date: "2099-01-01" },
    { date: "2026-02-30" },
  ])
    assert.equal(
      (await request("", "POST", { ...payload, ...changes })).status,
      400,
    );
  const second = await request("", "POST", {
    ...payload,
    date: "2026-11-05",
    sleep_hours: 0,
  });
  assert.equal(second.status, 201);
  assert.equal(
    (await request(`/${second.data.id}`, "PUT", payload)).status,
    409,
  );
  assert.equal(
    (
      await request(`/${created.data.id}`, "PUT", {
        ...payload,
        sleep_hours: 8.5,
        mood: 5,
        notes: "Updated",
      })
    ).status,
    200,
  );
  const entries = (await request()).data.entries;
  assert.equal(entries[0].sleep_hours, 8.5);
  assert.equal(entries[0].notes, "Updated");
  assert.ok(entries.every((entry) => !("user_id" in entry)));
  assert.equal((await request(`/${created.data.id}`, "DELETE")).status, 200);
  assert.equal((await request(`/${created.data.id}`, "DELETE")).status, 404);
});
