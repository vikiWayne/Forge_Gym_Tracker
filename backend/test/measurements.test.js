import { test, after } from "node:test";
import assert from "node:assert/strict";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { measurementsRoutes } =
  await import("../src/features/measurements/measurements.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (
    !["measurement-owner", "measurement-other"].includes(
      req.headers["x-test-user"],
    )
  )
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
measurementsRoutes(app);
app.use(errorHandler);
for (const id of ["measurement-owner", "measurement-other"])
  db.prepare(
    "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
  ).run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/measurements`;
async function request(
  path = "",
  method = "GET",
  body,
  user = "measurement-owner",
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
test("body measurement CRUD is private and validates type, date and decimal centimeters", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  const payload = {
    type: "waist",
    value: 82.35,
    date: "2026-11-06",
    notes: "Morning",
  };
  const created = await request("", "POST", payload);
  assert.equal(created.status, 201);
  assert.equal(
    (await request("", "GET", undefined, "measurement-other")).data.entries
      .length,
    0,
  );
  assert.equal(
    (
      await request(
        `/${created.data.id}`,
        "PUT",
        { ...payload, value: 83 },
        "measurement-other",
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/${created.data.id}`,
        "DELETE",
        undefined,
        "measurement-other",
      )
    ).status,
    404,
  );
  for (const changes of [
    { value: 82.351 },
    { value: 0 },
    { value: 501 },
    { type: "unknown" },
    { date: "2099-01-01" },
    { date: "2026-02-30" },
  ]) {
    assert.equal(
      (await request("", "POST", { ...payload, ...changes })).status,
      400,
    );
  }
  const second = await request("", "POST", { ...payload, value: 81.25 });
  await request("", "POST", { ...payload, type: "chest", value: 100 });
  const listed = (await request()).data.entries;
  assert.equal(listed.length, 3);
  assert.equal(
    listed.filter((entry) => entry.type === "waist")[0].id,
    second.data.id,
  );
  assert.equal(
    listed.some((entry) => "user_id" in entry),
    false,
  );
  assert.equal(
    (
      await request(`/${created.data.id}`, "PUT", {
        ...payload,
        type: "left-arm",
        value: 35.5,
      })
    ).status,
    200,
  );
  assert.equal(
    (await request()).data.entries.find((entry) => entry.id === created.data.id)
      .type,
    "left-arm",
  );
  assert.equal((await request(`/${created.data.id}`, "DELETE")).status, 200);
  assert.equal((await request(`/${created.data.id}`, "DELETE")).status, 404);
});
