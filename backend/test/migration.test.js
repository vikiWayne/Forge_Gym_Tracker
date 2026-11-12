import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { migrateTraining } from "../src/database/trainingMigration.js";
import { localDatabase } from "../src/database/adapter.js";
test("existing categories and workout records migrate without losing set data", async () => {
  const db = new DatabaseSync(":memory:");
  db.exec(`PRAGMA foreign_keys=ON; CREATE TABLE users(id TEXT PRIMARY KEY); CREATE TABLE exercises(id TEXT PRIMARY KEY,user_id TEXT,category TEXT); CREATE TABLE logs(id TEXT PRIMARY KEY,weight REAL,reps INTEGER);
 INSERT INTO users VALUES('owner'); INSERT INTO exercises VALUES('exercise','owner','Strength'); INSERT INTO logs VALUES('workout',30,12);`);
  await migrateTraining(localDatabase(db));
  const category = db.prepare("SELECT * FROM categories").get();
  assert.equal(category.name, "Strength");
  assert.equal(
    db.prepare("SELECT category_id FROM exercises").get().category_id,
    category.id,
  );
  assert.deepEqual(
    {
      ...db
        .prepare("SELECT weight,reps FROM log_sets WHERE log_id=?")
        .get("workout"),
    },
    { weight: 30, reps: 12 },
  );
  db.prepare("INSERT INTO log_sets VALUES(?,?,?,?)").run("workout", 2, 40, 8);
  await migrateTraining(localDatabase(db));
  assert.equal(
    db.prepare("SELECT COUNT(*) AS count FROM categories").get().count,
    1,
  );
  assert.equal(
    db.prepare("SELECT COUNT(*) AS count FROM log_sets").get().count,
    2,
  );
  db.prepare("DELETE FROM logs WHERE id=?").run("workout");
  assert.equal(
    db.prepare("SELECT COUNT(*) AS count FROM log_sets").get().count,
    0,
  );
  db.close();
});
