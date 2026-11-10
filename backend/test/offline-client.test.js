import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(
  new URL("../../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
async function clientModule(file) {
  const source = readFileSync(
    new URL(`../../frontend/src/features/offline/${file}.ts`, import.meta.url),
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
test("offline storage clears account data on switching and locally locks sign-out", async () => {
  const oldWindow = globalThis.window,
    oldStorage = globalThis.localStorage;
  globalThis.window = new EventTarget();
  globalThis.localStorage = {
    getItem(key) {
      return this[key] ?? null;
    },
    setItem(key, value) {
      this[key] = String(value);
    },
    removeItem(key) {
      delete this[key];
    },
  };
  try {
    const storage = await clientModule("storage");
    storage.setOfflineUser({ id: "account-a", email: "a@example.com" });
    storage.writeOffline("training", { private: "account-a" });
    storage.enqueueWorkout("request-a", { sets: [] });
    storage.enqueueWorkout("request-a", { sets: [] });
    assert.equal(storage.pendingWorkouts().length, 1);
    storage.setOfflineUser({ id: "account-b", email: "b@example.com" });
    assert.equal(storage.readOffline("training"), null);
    assert.equal(storage.pendingWorkouts().length, 0);
    storage.signOutLocally();
    assert.equal(storage.offlineAccount(), null);
    assert.equal(storage.cachedUser(), null);
    assert.equal(storage.locallySignedOut(), true);
    storage.setOfflineUser({ id: "account-a", email: "a@example.com" });
    assert.equal(storage.locallySignedOut(), false);
    assert.equal(storage.readOffline("training"), null);
  } finally {
    globalThis.window = oldWindow;
    globalThis.localStorage = oldStorage;
  }
});
test("offline queue validates complete workouts before accepting a device copy", async () => {
  const { validOfflineWorkout } = await clientModule("validation");
  const workout = {
    exercise_id: "12345678-1234-1234-1234-123456789012",
    date: "2024-02-29",
    sets: [{ weight: 20.5, reps: 8, rpe: 8.5, rir: 0 }],
    notes: "Recorded offline",
  };
  assert.equal(validOfflineWorkout(workout), true);
  for (const invalid of [
    { ...workout, sets: [] },
    { ...workout, sets: [{ weight: 1.234, reps: 8 }] },
    { ...workout, sets: [{ weight: 20, reps: 0 }] },
    { ...workout, sets: [{ weight: 20, reps: 8, rpe: 8.3 }] },
    { ...workout, date: "2024-02-30" },
    { ...workout, date: "2999-01-01" },
  ])
    assert.equal(validOfflineWorkout(invalid), false);
});
