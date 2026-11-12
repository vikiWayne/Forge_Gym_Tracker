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
  const values = new Map(
    response.headers.getSetCookie().map((raw) => {
      const pair = raw.split(";")[0],
        split = pair.indexOf("=");
      return [pair.slice(0, split), pair.slice(split + 1)];
    }),
  );
  return {
    status: response.status,
    data: await response.json(),
    cookie: Array.from(values, ([name, value]) => `${name}=${value}`).join(
      "; ",
    ),
  };
}
async function register(username) {
  return request("/auth/register", "POST", {
    username,
    password: "original-password",
    age: 30,
    weight: 72.35,
    sex: "Prefer not to say",
  });
}
test("owned protein and body-weight journals, edits, decimal precision and profile sync", async () => {
  const owner = await register("tracker_owner"),
    other = await register("tracker_other");
  const cookie = owner.cookie;
  for (const endpoint of ["protein", "body-weight"])
    assert.equal((await request(`/${endpoint}`)).status, 401);
  const protein = await request(
    "/protein",
    "POST",
    { value: 25.12, date: "2026-11-06", label: "Lunch", notes: "Home cooked" },
    cookie,
  );
  assert.equal(protein.status, 201);
  assert.equal(
    (
      await request(
        "/protein",
        "POST",
        { value: 25.123, date: "2026-11-06" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("/protein", "GET", undefined, other.cookie)).data.entries
      .length,
    0,
  );
  assert.equal(
    (
      await request(
        `/protein/${protein.data.id}`,
        "PUT",
        { value: 30.5, date: "2026-11-06" },
        other.cookie,
      )
    ).status,
    404,
  );
  assert.equal(
    (
      await request(
        `/protein/${protein.data.id}`,
        "PUT",
        { value: 30.5, date: "2026-11-06", notes: "Updated" },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/protein", "GET", undefined, cookie)).data.entries[0].value,
    30.5,
  );
  const old = await request(
    "/body-weight",
    "POST",
    { value: 73.01, date: "2026-11-04", notes: "Morning" },
    cookie,
  );
  assert.equal(old.status, 201);
  const current = await request(
    "/body-weight",
    "POST",
    { value: 72.35, date: "2026-11-06" },
    cookie,
  );
  assert.equal(current.status, 201);
  assert.equal(
    (await request("/me", "GET", undefined, cookie)).data.weight,
    72.35,
  );
  assert.equal(
    (
      await request(
        "/body-weight",
        "POST",
        { value: 72.345, date: "2026-11-06" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/me",
        "PUT",
        { age: 30, weight: 72.345, sex: "Male" },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        `/body-weight/${current.data.id}`,
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
        `/body-weight/${current.data.id}`,
        "PUT",
        { value: 72.4, date: "2026-11-06", notes: "Corrected" },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal(
    (await request("/me", "GET", undefined, cookie)).data.weight,
    72.4,
  );
  await request(`/body-weight/${current.data.id}`, "DELETE", undefined, cookie);
  assert.equal(
    (await request("/me", "GET", undefined, cookie)).data.weight,
    73.01,
  );
  assert.equal(
    (await request("/body-weight", "GET", undefined, cookie)).data.entries[0]
      .notes,
    "Morning",
  );
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
  assert.equal(
    (
      await request(
        "/logs",
        "POST",
        {
          exercise_id: exercise.data.id,
          sets: [{ weight: 30.555, reps: 8 }],
          date: "2026-11-06",
        },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/logs",
        "POST",
        {
          exercise_id: exercise.data.id,
          sets: [{ weight: 30.55, reps: 8 }],
          date: "2026-11-06",
        },
        cookie,
      )
    ).status,
    201,
  );
  const draft = await request("/auth/continue", "POST", {
    username: "precision_new",
    password: "original-password",
  });
  assert.equal(
    (
      await request(
        "/auth/onboarding",
        "POST",
        { age: 30, weight: 70.123, sex: "Male" },
        draft.cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    await db
      .prepare("SELECT id FROM users WHERE username=?")
      .get("precision_new"),
    undefined,
  );
  await request(`/protein/${protein.data.id}`, "DELETE", undefined, cookie);
  assert.equal(
    (await request("/protein", "GET", undefined, cookie)).data.entries.length,
    0,
  );
});
test("password changes verify current password, revoke other sessions and reset uses a one-use code", async () => {
  const account = await register("secure_owner");
  const cookie = account.cookie;
  assert.match(account.data.recovery_code, /^FORGE-/);
  assert.equal(
    (await request("/me/security", "GET", undefined, cookie)).data
      .has_recovery_code,
    true,
  );
  const otherSession = await request("/auth/login", "POST", {
    username: "secure_owner",
    password: "original-password",
  });
  assert.equal(
    (
      await request(
        "/me/password",
        "POST",
        {
          current_password: "incorrect-password",
          new_password: "changed-password",
        },
        cookie,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/me/password",
        "POST",
        {
          current_password: "original-password",
          new_password: "changed-password",
        },
        cookie,
      )
    ).status,
    200,
  );
  assert.equal((await request("/me", "GET", undefined, cookie)).status, 200);
  assert.equal(
    (await request("/me", "GET", undefined, otherSession.cookie)).status,
    401,
  );
  assert.equal(
    (await request("/me/security", "GET", undefined, cookie)).data
      .has_recovery_code,
    false,
  );
  assert.equal(
    (
      await request("/auth/reset-password", "POST", {
        username: "secure_owner",
        recovery_code: account.data.recovery_code,
        new_password: "reset-password",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(
        "/me/recovery-code",
        "POST",
        { current_password: "incorrect-password" },
        cookie,
      )
    ).status,
    400,
  );
  const code = await request(
    "/me/recovery-code",
    "POST",
    { current_password: "changed-password" },
    cookie,
  );
  assert.match(code.data.recovery_code, /^FORGE-/);
  const stored = (
    await db
      .prepare("SELECT recovery_hash FROM account_security WHERE user_id=?")
      .get(account.data.id)
  ).recovery_hash;
  assert.notEqual(stored, code.data.recovery_code);
  assert.equal(stored.length, 64);
  assert.equal(
    (
      await request("/auth/reset-password", "POST", {
        username: "wrong_account",
        recovery_code: code.data.recovery_code,
        new_password: "reset-password",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/auth/reset-password", "POST", {
        username: "secure_owner",
        recovery_code: code.data.recovery_code,
        new_password: "reset-password",
      })
    ).status,
    200,
  );
  assert.equal((await request("/me", "GET", undefined, cookie)).status, 401);
  assert.equal(
    (
      await request("/auth/reset-password", "POST", {
        username: "secure_owner",
        recovery_code: code.data.recovery_code,
        new_password: "another-password",
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request("/auth/login", "POST", {
        username: "secure_owner",
        password: "changed-password",
      })
    ).status,
    401,
  );
  assert.equal(
    (
      await request("/auth/login", "POST", {
        username: "secure_owner",
        password: "reset-password",
      })
    ).status,
    200,
  );
});
