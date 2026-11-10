import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
process.env.DB_PATH = ":memory:";
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api`;
async function request(path, method = "GET", body, cookie) {
  const response = await fetch(base + path, {
    method,
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return {
    status: response.status,
    data: await response.json(),
    cookie: response.headers
      .getSetCookie()
      .map((value) => value.split(";")[0])
      .join("; "),
  };
}
test("optional set effort validates, persists through editing and active sessions, and participates in offline replay", async () => {
  const user = await request("/auth/register", "POST", {
    email: "effort@example.com",
    username: "effort_lifter",
    password: "effort-password",
    age: 30,
    weight: 70,
    sex: "Other",
  });
  assert.equal(user.status, 201);
  const cookie = user.cookie;
  const category = await request(
    "/categories",
    "POST",
    { name: "Push" },
    cookie,
  );
  const exercise = await request(
    "/exercises",
    "POST",
    { name: "Press", category_id: category.data.id },
    cookie,
  );
  const body = {
    exercise_id: exercise.data.id,
    date: "2026-11-06",
    notes: "Working set",
    sets: [{ weight: 40, reps: 8, rpe: 8.5, rir: 0 }],
  };
  for (const patch of [
    { rpe: 0 },
    { rpe: 10.5 },
    { rpe: 8.2 },
    { rir: -1 },
    { rir: 11 },
    { rir: 1.5 },
  ]) {
    assert.equal(
      (
        await request(
          "/logs",
          "POST",
          { ...body, sets: [{ ...body.sets[0], ...patch }] },
          cookie,
        )
      ).status,
      400,
    );
  }
  const client_id = randomUUID();
  const saved = await request("/logs", "POST", { ...body, client_id }, cookie);
  assert.equal(saved.status, 201);
  assert.equal(
    (await request("/logs", "POST", { ...body, client_id }, cookie)).status,
    200,
  );
  assert.equal(
    (
      await request(
        "/logs",
        "POST",
        { ...body, client_id, sets: [{ ...body.sets[0], rpe: 9 }] },
        cookie,
      )
    ).status,
    409,
  );
  let logs = (await request("/data", "GET", undefined, cookie)).data.logs;
  assert.deepEqual(logs[0].sets, body.sets);
  const cleared = {
    ...body,
    sets: [{ weight: 40, reps: 8, rpe: null, rir: null }],
  };
  assert.equal(
    (await request(`/logs/${saved.data.id}`, "PUT", cleared, cookie)).status,
    200,
  );
  logs = (await request("/data", "GET", undefined, cookie)).data.logs;
  assert.deepEqual(logs[0].sets, [{ weight: 40, reps: 8 }]);
  const routine = await request(
    "/routines",
    "POST",
    {
      name: "Effort session",
      exercises: [
        { exercise_id: exercise.data.id, sets: [{ weight: 45, reps: 6 }] },
      ],
    },
    cookie,
  );
  const started = await request(
    "/training-session",
    "POST",
    { routine_id: routine.data.id },
    cookie,
  );
  const session = started.data;
  session.exercises[0].sets[0] = {
    weight: 45,
    reps: 6,
    done: true,
    rpe: 9,
    rir: 1,
  };
  assert.equal(
    (await request(`/training-session/${session.id}`, "PUT", session, cookie))
      .status,
    200,
  );
  const restored = (
    await request("/training-session", "GET", undefined, cookie)
  ).data;
  assert.equal(restored.exercises[0].sets[0].rpe, 9);
  assert.equal(restored.exercises[0].sets[0].rir, 1);
  assert.equal(
    (
      await request(
        `/training-session/${session.id}/finish`,
        "POST",
        {},
        cookie,
      )
    ).status,
    200,
  );
  logs = (await request("/data", "GET", undefined, cookie)).data.logs;
  assert.ok(
    logs.some((log) =>
      log.sets.some(
        (set) => set.weight === 45 && set.rpe === 9 && set.rir === 1,
      ),
    ),
  );
});
