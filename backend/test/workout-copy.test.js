import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
const source = readFileSync(
  new URL(
    "../../frontend/src/features/workouts/copyWorkout.ts",
    import.meta.url,
  ),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { copyWorkoutDraft } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
test("copy draft preserves all sets and effort, changes date and strips saved/replay identities", () => {
  const source = {
    id: "saved-workout",
    user_id: "owner",
    client_id: "replay-id",
    pending_sync: false,
    exercise_id: "exercise",
    weight: 40,
    reps: 8,
    date: "2026-11-04",
    notes: "Brace, then press",
    sets: [
      { weight: 30, reps: 10, rpe: 7.5, rir: 0 },
      { weight: 40, reps: 8 },
    ],
  };
  const before = structuredClone(source);
  const copy = copyWorkoutDraft(source, "2026-11-10");
  assert.deepEqual(copy, {
    exercise_id: "exercise",
    date: "2026-11-10",
    notes: "Brace, then press",
    sets: source.sets,
  });
  assert.deepEqual(source, before);
  for (const key of [
    "id",
    "user_id",
    "client_id",
    "pending_sync",
    "weight",
    "reps",
  ])
    assert.equal(key in copy, false);
  copy.sets[0].weight = 99;
  assert.equal(source.sets[0].weight, 30);
  assert.equal(copy.sets[0].rir, 0);
});
