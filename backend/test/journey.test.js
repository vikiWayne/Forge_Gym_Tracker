import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
const require = createRequire(
  new URL("../../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
const source = readFileSync(
  new URL("../../frontend/src/features/dashboard/journey.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { journeyProgress } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
test("journey XP comes only from distinct saved workouts and real training dates", () => {
  const today = "2026-11-10";
  const log = (id, date, count = 1, extra = {}) => ({
    id,
    date,
    sets: Array.from({ length: count }, () => ({ weight: 20, reps: 8 })),
    ...extra,
  });
  const result = journeyProgress(
    [
      log("first", "2026-11-08", 2),
      log("first", "2026-11-08", 2),
      log("second", "2026-11-08"),
      log("third", "2026-11-10"),
      log("future", "2026-11-11", 10),
      log("draft", "2026-11-10", 10, { pending_sync: true }),
      log("invalid", "2026-02-30", 10),
    ],
    today,
  );
  assert.equal(result.sets, 4);
  assert.equal(result.days, 2);
  assert.equal(result.xp, 90);
  assert.equal(result.milestones.filter((item) => item.earned).length, 1);
  const empty = journeyProgress([], today);
  assert.equal(empty.level, 1);
  assert.equal(empty.xp, 0);
  assert.equal(
    empty.milestones.some((item) => item.earned),
    false,
  );
  const next = journeyProgress([log("big", today, 23)], today);
  assert.equal(next.xp, 255);
  assert.equal(next.level, 2);
  assert.equal(next.progress, 5);
});
