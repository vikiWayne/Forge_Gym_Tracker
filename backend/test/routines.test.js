import { test, after } from "node:test";
import assert from "node:assert/strict";
process.env.DB_PATH = ":memory:";
const { app } = await import("../src/app.js");
const { db } = await import("../src/database/connection.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api`;
async function request(path, method = "GET", body, cookie) {
  if (path.startsWith("/auth/") && body?.username && !body.email)
    body = {
      ...body,
      email: `${body.username.toLowerCase() === "renamed_lifter" ? "fresh_lifter" : body.username.toLowerCase()}@example.com`,
    };
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
      .map((item) => item.split(";")[0])
      .join("; "),
  };
}
async function account(username) {
  const user = await request("/auth/register", "POST", {
    username,
    password: "routine-password",
    age: 30,
    weight: 70,
    sex: "Other",
  });
  const category = await request(
    "/categories",
    "POST",
    { name: "Push" },
    user.cookie,
  );
  const exercise = await request(
    "/exercises",
    "POST",
    { name: "Press", category_id: category.data.id },
    user.cookie,
  );
  return { cookie: user.cookie, exercise_id: exercise.data.id };
}
test("routines and sessions stay owned; completed sets save atomically and finish is idempotent", async () => {
  const owner = await account("routine_owner"),
    other = await account("routine_other");
  const payload = {
    name: "Push day",
    notes: "Brace",
    exercises: [
      {
        exercise_id: owner.exercise_id,
        sets: [
          { weight: 30, reps: 10 },
          { weight: 40, reps: 8 },
        ],
      },
    ],
  };
  assert.equal((await request("/routines")).status, 401);
  assert.equal(
    (await request("/routines", "POST", payload, other.cookie)).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/routines",
        "POST",
        { ...payload, exercises: [] },
        owner.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/routines",
        "POST",
        {
          ...payload,
          exercises: [
            {
              exercise_id: owner.exercise_id,
              sets: [{ weight: 1.234, reps: 8 }],
            },
          ],
        },
        owner.cookie,
      )
    ).status,
    400,
  );
  const created = await request("/routines", "POST", payload, owner.cookie);
  assert.equal(created.status, 201);
  const id = created.data.id;
  assert.deepEqual(
    (await request("/routines", "GET", undefined, other.cookie)).data,
    [],
  );
  assert.equal(
    (
      await request(
        `/routines/${id}`,
        "PUT",
        {
          ...payload,
          exercises: [
            { ...payload.exercises[0], exercise_id: other.exercise_id },
          ],
        },
        other.cookie,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        "/training-session",
        "POST",
        { routine_id: id },
        other.cookie,
      )
    ).status,
    404,
  );
  const started = await request(
    "/training-session",
    "POST",
    { routine_id: id },
    owner.cookie,
  );
  assert.equal(started.status, 201);
  const session = started.data;
  assert.equal(session.exercises[0].sets[0].done, false);
  assert.equal(
    (
      await request(
        "/training-session",
        "POST",
        { routine_id: id },
        owner.cookie,
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await request(
        `/training-session/${session.id}/finish`,
        "POST",
        {},
        owner.cookie,
      )
    ).status,
    400,
  );
  session.exercises[0].sets[1] = { weight: 42.5, reps: 7, done: true };
  session.rest_until = Date.now() + 90000;
  assert.equal(
    (
      await request(
        `/training-session/${session.id}`,
        "PUT",
        session,
        other.cookie,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/training-session/${session.id}`,
        "PUT",
        session,
        owner.cookie,
      )
    ).status,
    200,
  );
  const resumed = (
    await request("/training-session", "GET", undefined, owner.cookie)
  ).data;
  assert.equal(resumed.rest_until, session.rest_until);
  assert.equal(resumed.started_at, session.started_at);
  assert.equal(resumed.exercises[0].sets[1].weight, 42.5);
  const changed = structuredClone(session);
  changed.exercises[0].exercise_id = other.exercise_id;
  assert.equal(
    (
      await request(
        `/training-session/${session.id}`,
        "PUT",
        changed,
        owner.cookie,
      )
    ).status,
    400,
  );
  // Editing the routine does not mutate an already-started session.
  assert.equal(
    (
      await request(
        `/routines/${id}`,
        "PUT",
        { ...payload, name: "Changed routine" },
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/training-session", "GET", undefined, owner.cookie)).data
      .name,
    "Push day",
  );
  assert.equal(
    (
      await request(
        `/training-session/${session.id}/finish`,
        "POST",
        {},
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (
      await request(
        `/training-session/${session.id}/finish`,
        "POST",
        {},
        owner.cookie,
      )
    ).status,
    200,
  );
  const data = (await request("/data", "GET", undefined, owner.cookie)).data;
  assert.equal(data.logs.length, 1);
  assert.deepEqual(data.logs[0].sets, [{ weight: 42.5, reps: 7 }]);
  assert.equal(data.logs[0].notes, "Brace");
  assert.equal(
    (await request("/training-session", "GET", undefined, owner.cookie)).data,
    null,
  );
  assert.equal(
    (
      await request(
        `/training-session/${session.id}`,
        "PUT",
        session,
        owner.cookie,
      )
    ).status,
    404,
  );
  const history = (
    await request("/training-sessions", "GET", undefined, owner.cookie)
  ).data;
  assert.equal(history.length, 1);
  assert.ok(history[0].finished_at >= history[0].started_at);
  assert.deepEqual(
    (await request("/training-sessions", "GET", undefined, other.cookie)).data,
    [],
  );
  const next = await request(
    "/training-session",
    "POST",
    { routine_id: id },
    owner.cookie,
  );
  assert.equal(
    (
      await request(
        `/training-session/${next.data.id}`,
        "DELETE",
        undefined,
        other.cookie,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/training-session/${next.data.id}`,
        "DELETE",
        undefined,
        owner.cookie,
      )
    ).status,
    200,
  );
  assert.equal(db.prepare("SELECT COUNT(*) AS count FROM logs").get().count, 1);
  assert.equal(
    (await request(`/routines/${id}`, "DELETE", undefined, other.cookie))
      .status,
    404,
  );
  // Deleted library exercises produce a recoverable routine validation error.
  await request(
    `/exercises/${owner.exercise_id}`,
    "DELETE",
    undefined,
    owner.cookie,
  );
  assert.equal(
    (
      await request(
        "/training-session",
        "POST",
        { routine_id: id },
        owner.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request(`/routines/${id}`, "DELETE", undefined, owner.cookie))
      .status,
    200,
  );
});
