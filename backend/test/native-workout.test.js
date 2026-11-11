import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(
  new URL("../../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
async function moduleAt(path) {
  const source = readFileSync(
    new URL(`../../frontend/src/${path}.ts`, import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  });
  return import(
    "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
  );
}
const { workoutStatus, workoutDeepLink, MAX_ACTIVITY_MS } = await moduleAt(
  "features/native/workoutStatus",
);
const { nativeApiUrl } = await moduleAt("shared/api/nativeApiUrl");
const { createNativeQueue } = await moduleAt("features/native/queue");
const now = 1_800_000_000_000;
const session = {
  id: "session-a",
  name: "Strength",
  started_at: now - 10_000,
  finished_at: null,
  notes: "PRIVATE NOTES",
  email: "private@example.test",
  rest_until: now + 60_000,
  exercises: [
    { name: "Press", sets: [{ weight: 90, reps: 5, done: true }] },
    { name: "Row", sets: [{ weight: 50, reps: 8, done: false }] },
  ],
};
test("native status exposes minimum workout details and caps lifetime and rest deadlines", () => {
  const status = workoutStatus(session, now);
  assert.equal(status.completedSets, 1);
  assert.equal(status.totalSets, 2);
  assert.equal(status.exercise, "Row");
  assert.equal(status.expiresAt, session.started_at + MAX_ACTIVITY_MS);
  assert.equal(status.restUntil, session.rest_until);
  assert.deepEqual(
    Object.keys(status).sort(),
    [
      "completedSets",
      "exercise",
      "expiresAt",
      "restUntil",
      "sessionId",
      "startedAt",
      "title",
      "totalSets",
    ].sort(),
  );
  for (const value of [
    "PRIVATE NOTES",
    "private@example.test",
    "weight",
    "reps",
  ])
    assert.equal(JSON.stringify(status).includes(value), false);
  assert.equal(
    workoutStatus({ ...session, rest_until: now - 1 }, now).restUntil,
    null,
  );
  assert.equal(
    workoutStatus({ ...session, rest_until: now + MAX_ACTIVITY_MS * 2 }, now)
      .restUntil,
    status.expiresAt,
  );
  assert.equal(
    workoutStatus({ ...session, name: "a".repeat(100) }, now).title.length,
    80,
  );
});
test("finished, expired and future workouts cannot create a lock-screen activity", () => {
  assert.equal(workoutStatus({ ...session, finished_at: now }, now), null);
  assert.equal(
    workoutStatus({ ...session, started_at: now - MAX_ACTIVITY_MS }, now),
    null,
  );
  assert.equal(workoutStatus({ ...session, started_at: now + 1 }, now), null);
  assert.equal(workoutStatus({ ...session, started_at: NaN }, now), null);
});
test("native deep links only open the workout route without accepting arbitrary destinations", () => {
  assert.equal(
    workoutDeepLink("forgegym://workout/active"),
    "/workouts/active",
  );
  for (const url of [
    "https://workout/active",
    "forgegym://evil/active",
    "forgegym://workout/active?redirect=https://evil.test",
    "forgegym://workout/active#script",
    "javascript:alert(1)",
    "invalid",
  ])
    assert.equal(workoutDeepLink(url), null);
});
test("native API traffic requires a configured HTTPS origin and stays within API paths", () => {
  assert.equal(
    nativeApiUrl("/api/me", "https://forge.example.test"),
    "https://forge.example.test/api/me",
  );
  for (const origin of [
    undefined,
    "http://forge.example.test",
    "https://user:pass@forge.example.test",
    "https://forge.example.test/subpath",
    "https://forge.example.test?token=secret",
    "https://forge.example.test/#other",
  ])
    assert.throws(() => nativeApiUrl("/api/me", origin));
  for (const path of [
    "https://evil.test",
    "//evil.test",
    "/api/../private",
    "/api/\\evil.test",
    "/profile",
  ])
    assert.throws(() => nativeApiUrl(path, "https://forge.example.test"));
});

test("native status updates finish before end, and failed updates cannot block cleanup", async () => {
  const queue = createNativeQueue();
  const events = [];
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const first = queue(async () => {
    events.push("update-start");
    await waiting;
    events.push("update-finish");
  });
  const failed = queue(async () => {
    events.push("failed-update");
    throw new Error("OS denied update");
  });
  const checked = assert.rejects(failed, /OS denied update/);
  const end = queue(async () => {
    events.push("end");
  });
  await Promise.resolve();
  await Promise.resolve();
  assert.deepEqual(events, ["update-start"]);
  release();
  await Promise.all([first, checked, end]);
  assert.deepEqual(events, [
    "update-start",
    "update-finish",
    "failed-update",
    "end",
  ]);
});
