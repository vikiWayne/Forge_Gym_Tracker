import { test, after } from "node:test";
import assert from "node:assert/strict";
process.env.DB_PATH = ":memory:";
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((r) => server.once("listening", r));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api`;
async function request(path, method = "GET", data, cookie) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers.get("set-cookie")?.split(";")[0],
  };
}
test("account isolation, CRUD, consent and logout", async () => {
  for (const [path, method, data] of [
    ["/me", "GET"],
    ["/data", "GET"],
    ["/plans", "GET"],
    ["/exercises", "POST", {}],
    ["/categories", "POST", {}],
    ["/logs", "POST", {}],
    ["/logs/not-owned", "DELETE"],
    ["/auth/logout", "POST", {}],
  ])
    assert.equal((await request(path, method, data)).status, 401);
  const crossOrigin = await fetch(base + "/auth/login", {
    method: "POST",
    headers: {
      origin: "https://untrusted.invalid",
      "content-type": "application/json",
    },
    body: JSON.stringify({ username: "blocked", password: "blocked-password" }),
  });
  assert.equal(crossOrigin.status, 403);
  const a = await request("/auth/register", "POST", {
    username: "alice",
    password: "long-password",
    age: 27,
    weight: 70,
    sex: "Female",
  });
  const b = await request("/auth/register", "POST", {
    username: "bob",
    password: "long-password",
    age: 29,
    weight: 80,
    sex: "Male",
  });
  assert.equal(a.status, 201);
  assert.equal(b.status, 201);
  assert.match(a.cookie, /^session=/);
  const duplicate = await request("/auth/register", "POST", {
    username: "ALICE",
    password: "long-password",
    age: 27,
    weight: 70,
    sex: "Female",
  });
  assert.equal(duplicate.status, 409);
  assert.match(duplicate.data.error, /Choose another username, or sign in/);
  assert.deepEqual((await request("/data", "GET", undefined, a.cookie)).data, {
    categories: [],
    exercises: [],
    logs: [],
  });
  assert.deepEqual(
    (await request("/plans", "GET", undefined, a.cookie)).data,
    [],
  );
  assert.equal((await request("/me", "GET", undefined, a.cookie)).data.age, 27);
  assert.equal(
    (
      await request("/auth/login", "POST", {
        username: "alice",
        password: "incorrect",
      })
    ).status,
    401,
  );
  const category = await request(
    "/categories",
    "POST",
    { name: "Push" },
    a.cookie,
  );
  assert.equal(category.status, 201);
  assert.equal(
    (await request("/categories", "POST", { name: "push" }, a.cookie)).status,
    409,
  );
  assert.equal(
    (
      await request(
        "/exercises",
        "POST",
        { name: "Blocked", category_id: category.data.id },
        b.cookie,
      )
    ).status,
    400,
  );
  const exercise = await request(
    "/exercises",
    "POST",
    { name: "Bench press", category_id: category.data.id, notes: "Brace" },
    a.cookie,
  );
  const secondCategory = await request(
    "/categories",
    "POST",
    { name: "Upper" },
    a.cookie,
  );
  assert.equal(
    (
      await request(
        `/exercises/${exercise.data.id}`,
        "PATCH",
        { category_id: secondCategory.data.id },
        a.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/data", "GET", undefined, a.cookie)).data.exercises[0]
      .category,
    "Upper",
  );
  const otherCategory = await request(
    "/categories",
    "POST",
    { name: "Pull" },
    b.cookie,
  );
  assert.equal(
    (
      await request(
        `/exercises/${exercise.data.id}`,
        "PATCH",
        { category_id: otherCategory.data.id },
        a.cookie,
      )
    ).status,
    400,
  );
  const payload = {
    exercise_id: exercise.data.id,
    sets: [
      { weight: 30, reps: 12 },
      { weight: 40, reps: 8 },
      { weight: 40, reps: 8 },
    ],
    date: "2026-11-04",
    notes: "Good session",
  };
  assert.equal((await request("/logs", "POST", payload, b.cookie)).status, 400);
  assert.equal(
    (
      await request(
        "/logs",
        "POST",
        { ...payload, sets: [{ weight: 30, reps: 0 }] },
        a.cookie,
      )
    ).status,
    400,
  );
  assert.equal((await request("/logs", "POST", payload, a.cookie)).status, 201);
  assert.equal(
    (await request("/data", "GET", undefined, b.cookie)).data.logs.length,
    0,
  );
  const log = (await request("/data", "GET", undefined, a.cookie)).data.logs[0];
  assert.deepEqual(log.sets, payload.sets);
  assert.equal(log.weight, 40);
  assert.equal(log.reps, 8);
  assert.equal(
    log.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    1000,
  );
  assert.equal(
    (await request("/logs", "POST", { ...payload, sets: [] }, a.cookie)).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/logs/" + log.id,
        "PUT",
        {
          ...payload,
          sets: [
            { weight: 55, reps: 8 },
            { weight: 50, reps: 10 },
          ],
        },
        b.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/logs/" + log.id,
        "PUT",
        {
          ...payload,
          sets: [
            { weight: 55, reps: 8 },
            { weight: 50, reps: 10 },
          ],
        },
        a.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/exercises/" + exercise.data.id,
        "PATCH",
        { ready: true },
        a.cookie,
      )
    ).status,
    200,
  );
  const plan = await request(
    "/plans",
    "POST",
    { name: "Morning crew" },
    a.cookie,
  );
  assert.equal(
    (
      await request(
        `/plans/${plan.data.id}/invite`,
        "POST",
        { username: "bob" },
        a.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/plans", "GET", undefined, b.cookie)).data[0].logs.length,
    0,
  );
  await request(`/plans/${plan.data.id}/accept`, "POST", {}, b.cookie);
  assert.deepEqual(
    (await request("/plans", "GET", undefined, b.cookie)).data[0].logs[0].sets,
    [
      { weight: 55, reps: 8 },
      { weight: 50, reps: 10 },
    ],
  );
  assert.equal(
    (await request("/plans", "GET", undefined, b.cookie)).data[0].logs[0]
      .weight,
    55,
  );
  await request(
    `/plans/${plan.data.id}/membership`,
    "DELETE",
    undefined,
    b.cookie,
  );
  assert.equal(
    (await request("/plans", "GET", undefined, b.cookie)).data.length,
    0,
  );
  assert.equal(
    (await request("/logs/" + log.id, "DELETE", undefined, b.cookie)).status,
    404,
  );
  assert.equal(
    (await request("/logs/" + log.id, "DELETE", undefined, a.cookie)).status,
    200,
  );
  await request("/auth/logout", "POST", {}, a.cookie);
  assert.equal(
    (await request("/data", "GET", undefined, a.cookie)).status,
    401,
  );
});
