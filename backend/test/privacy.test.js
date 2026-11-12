import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { planRoutes } = await import("../src/features/plans/plans.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const app = express();
app.use(express.json());
const owner = randomUUID(),
  partner = randomUUID(),
  stranger = randomUUID();
app.use((req, res, next) => {
  if (![owner, partner, stranger].includes(req.headers["x-test-user"]))
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await planRoutes(app);
app.use(errorHandler);
for (const [id, username] of [
  [owner, "owner"],
  [partner, "partner"],
  [stranger, "stranger"],
]) {
  await db
    .prepare(
      "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
    )
    .run(
      id,
      username,
      "unused",
      30,
      70,
      "Other",
      `${username}@private.example`,
    );
}
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api`;
async function request(path, user = owner, method = "GET", data) {
  const response = await fetch(base + path, {
    method,
    headers: { "content-type": "application/json", "x-test-user": user },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  return { status: response.status, data: await response.json() };
}
async function log(user, notes = "private workout notes") {
  const exerciseId = randomUUID(),
    id = randomUUID();
  await db
    .prepare(
      "INSERT INTO exercises(id,user_id,name,category,notes) VALUES(?,?,?,?,?)",
    )
    .run(exerciseId, user, "Press", "Push", "private exercise notes");
  await db
    .prepare(
      "INSERT INTO logs(id,user_id,exercise_id,weight,reps,date,notes) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, user, exerciseId, 40, 8, "2026-11-06", notes);
  await db
    .prepare(
      "INSERT INTO log_sets(log_id,position,weight,reps) VALUES(?,?,?,?)",
    )
    .run(id, 1, 40, 8);
  return id;
}
test("accepted members control workouts and notes independently; all server responses enforce privacy", async () => {
  const first = await log(owner),
    second = await log(owner),
    partnerLog = await log(partner);
  const plan = await request("/plans", owner, "POST", {
    name: "Training crew",
  });
  const id = plan.data.id;
  assert.equal(
    (
      await request(`/plans/${id}/invite`, owner, "POST", {
        username: "partner",
      })
    ).status,
    200,
  );
  assert.equal((await request("/plans", partner)).data[0].logs.length, 0);
  assert.equal(
    (
      await request(`/plans/${id}/sharing`, partner, "PUT", {
        mode: "all",
        include_notes: true,
      })
    ).status,
    404,
  );
  await request(`/plans/${id}/accept`, partner, "POST", {});
  let viewed = (await request("/plans", partner)).data[0];
  assert.deepEqual(
    viewed.logs.map((item) => item.id),
    [partnerLog],
  );
  assert.equal(viewed.sharing.mode, "none");
  assert.equal(JSON.stringify(viewed).includes("@private.example"), false);
  assert.equal(
    (
      await request(`/plans/${id}/sharing`, stranger, "PUT", {
        mode: "all",
        include_notes: true,
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await request(`/plans/${id}/sharing`, owner, "PUT", {
        mode: "selected",
        include_notes: true,
        selected_log_ids: [partnerLog],
      })
    ).status,
    400,
  );
  assert.equal(
    (
      await request(`/plans/${id}/sharing`, owner, "PUT", {
        mode: "invalid",
        include_notes: false,
      })
    ).status,
    400,
  );
  await request(`/plans/${id}/sharing`, owner, "PUT", {
    mode: "selected",
    include_notes: false,
    selected_log_ids: [first],
  });
  viewed = (await request("/plans", partner)).data[0];
  assert.equal(
    viewed.logs.some((item) => item.id === first),
    true,
  );
  assert.equal(
    viewed.logs.some((item) => item.id === second),
    false,
  );
  assert.equal(viewed.logs.find((item) => item.id === first).notes, "");
  assert.equal(
    JSON.stringify(viewed).includes("private exercise notes"),
    false,
  );
  const future = await log(owner);
  assert.equal(
    (await request("/plans", partner)).data[0].logs.some(
      (item) => item.id === future,
    ),
    false,
  );
  const ownView = (await request("/plans", owner)).data[0];
  assert.equal(
    ownView.logs.find((item) => item.id === first).notes,
    "private workout notes",
  );
  await request(`/plans/${id}/sharing`, owner, "PUT", {
    mode: "all",
    include_notes: true,
    selected_log_ids: [],
  });
  viewed = (await request("/plans", partner)).data[0];
  assert.equal(viewed.logs.filter((item) => item.user_id === owner).length, 3);
  assert.equal(
    viewed.logs.find((item) => item.id === first).notes,
    "private workout notes",
  );
  await request(`/plans/${id}/sharing`, owner, "PUT", {
    mode: "none",
    include_notes: true,
    selected_log_ids: [],
  });
  assert.equal(
    (await request("/plans", partner)).data[0].logs.some(
      (item) => item.user_id === owner,
    ),
    false,
  );
  await request(`/plans/${id}/membership`, partner, "DELETE");
  assert.deepEqual((await request("/plans", partner)).data, []);
  assert.equal(
    (
      await request(`/plans/${id}/sharing`, partner, "PUT", {
        mode: "all",
        include_notes: true,
      })
    ).status,
    404,
  );
});
