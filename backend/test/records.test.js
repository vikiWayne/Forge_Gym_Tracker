import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(
  new URL("../../frontend/package.json", import.meta.url),
);
const ts = require("typescript");
const source = readFileSync(
  new URL("../../frontend/src/features/progress/records.ts", import.meta.url),
  "utf8",
);
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
});
const { personalRecords } = await import(
  "data:text/javascript;base64," + Buffer.from(outputText).toString("base64")
);
test("records inspect every set and recalculate after edits/deletions", () => {
  const logs = [
    {
      sets: [
        { weight: 100, reps: 1 },
        { weight: 80, reps: 10 },
      ],
    },
    {
      sets: [
        { weight: 20, reps: 30 },
        { weight: 90, reps: 10 },
      ],
    },
  ];
  const records = personalRecords(logs);
  assert.equal(records.heaviest, 100);
  assert.equal(records.mostReps, 30);
  assert.equal(records.estimatedMax, 120);
  assert.equal(records.volume, 1500);
  assert.deepEqual(records.repRecords, [
    [1, 100],
    [10, 90],
    [30, 20],
  ]);
  assert.equal(personalRecords(logs.slice(1)).heaviest, 90);
  assert.equal(personalRecords([]).volume, 0);
  assert.equal(
    personalRecords([{ sets: [{ weight: 100, reps: 11 }] }]).estimatedMax,
    0,
  );
});
