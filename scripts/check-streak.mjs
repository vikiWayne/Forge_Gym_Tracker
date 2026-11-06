import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
const source = readFileSync(
  new URL("../frontend/src/features/streak/streak.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { workoutStreak } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
const today = "2026-11-06";
for (const [dates, current, best, loggedToday] of [
  [[], 0, 0, false],
  [["2026-11-06", "2026-11-06"], 1, 1, true],
  [["2026-11-04", "2026-11-05"], 2, 2, false],
  [["2026-11-03", "2026-11-04"], 0, 2, false],
  [["2026-11-06", "2026-11-07", "invalid"], 1, 1, true],
  [["2026-10-30", "2026-10-31", "2026-11-01"], 0, 3, false],
  [["2024-02-28", "2024-02-29", "2024-03-01"], 0, 3, false],
]) {
  const result = workoutStreak(dates, today);
  assert.deepEqual(
    [result.current, result.best, result.loggedToday],
    [current, best, loggedToday],
  );
}
console.log(
  "7 streak cases passed: duplicates, grace period, missed days, future dates, month boundaries and leap day.",
);
