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
    "../../frontend/src/features/overload/progression.ts",
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
const { suggestProgression } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
const exercise = { id: "press", rep_min: 8, rep_max: 12 };
const log = (date, sets = [{ weight: 40, reps: 12 }], extra = {}) => ({
  exercise_id: "press",
  date,
  sets,
  ...extra,
});
const today = "2026-11-10";
test("progression requires two dates and every set at the top of range", () => {
  assert.equal(suggestProgression(exercise, [], today).kind, "insufficient");
  assert.equal(
    suggestProgression(exercise, [log(today), log(today)], today).kind,
    "insufficient",
  );
  const history = [log("2026-11-09"), log("2026-11-07")];
  assert.equal(suggestProgression(exercise, history, today).weight, 42.5);
  assert.equal(
    suggestProgression(exercise, history, today, 1.25).weight,
    41.25,
  );
  assert.equal(
    suggestProgression(
      exercise,
      [
        log("2026-11-09", [
          { weight: 40, reps: 12 },
          { weight: 40, reps: 10 },
        ]),
        history[1],
      ],
      today,
    ).kind,
    "hold",
  );
  assert.equal(
    suggestProgression(
      exercise,
      [history[0], log("2026-11-07", [{ weight: 30, reps: 12 }])],
      today,
    ).kind,
    "hold",
  );
});
test("progression excludes unsynced/future/unrelated logs and respects effort", () => {
  const one = log("2026-11-09");
  for (const second of [
    log("2026-11-11"),
    log("2026-11-07", undefined, { pending_sync: true }),
    log("2026-11-07", undefined, { exercise_id: "squat" }),
  ])
    assert.equal(
      suggestProgression(exercise, [one, second], today).kind,
      "insufficient",
    );
  for (const effort of [{ rpe: 9 }, { rir: 0 }])
    assert.equal(
      suggestProgression(
        exercise,
        [one, log("2026-11-07", [{ weight: 40, reps: 12, ...effort }])],
        today,
      ).kind,
      "hold",
    );
  assert.equal(
    suggestProgression(
      exercise,
      [one, log("2026-11-07", [{ weight: 40, reps: 12, rpe: 8, rir: 2 }])],
      today,
    ).kind,
    "increase",
  );
  const low = [
    log("2026-11-09", [{ weight: 40, reps: 6 }]),
    log("2026-11-07", [{ weight: 40, reps: 7 }]),
  ];
  assert.equal(suggestProgression(exercise, low, today).weight, 38);
  assert.equal(suggestProgression(exercise, low, today).kind, "reduce");
});
