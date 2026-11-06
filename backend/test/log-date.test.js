import { test } from "node:test";
import assert from "node:assert/strict";
import { dateSchema } from "../src/shared/validation.js";

test("log dates accept today and past dates but reject future and invalid dates", () => {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date());
  const tomorrow = new Date(today + "T12:00:00Z");
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  assert.equal(dateSchema.safeParse(today).success, true);
  assert.equal(dateSchema.safeParse("2024-02-29").success, true);
  assert.equal(dateSchema.safeParse("2024-02-30").success, false);
  const result = dateSchema.safeParse(tomorrow.toISOString().slice(0, 10));
  assert.equal(result.success, false);
  assert.match(result.error.message, /Future dates/);
});
