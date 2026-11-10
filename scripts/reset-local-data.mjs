import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import { resolve, relative } from "node:path";

if (!process.argv.includes("--confirm-delete-all")) {
  throw new Error(
    "This permanently clears local account data. Pass --confirm-delete-all to proceed.",
  );
}
const directory = fileURLToPath(new URL("../backend/data/", import.meta.url));
const target = resolve(directory, "forge.sqlite");
if (relative(directory, target) !== "forge.sqlite")
  throw new Error("Unexpected database path.");
const db = new DatabaseSync(target);
db.exec(
  "PRAGMA busy_timeout=5000; PRAGMA secure_delete=ON; PRAGMA foreign_keys=OFF;",
);
const tables = db
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
  )
  .all();
db.exec("BEGIN IMMEDIATE");
try {
  for (const { name } of tables)
    db.exec(`DELETE FROM "${name.replaceAll('"', '""')}"`);
  db.exec("COMMIT");
} catch (error) {
  db.exec("ROLLBACK");
  db.close();
  throw error;
}
const remaining = tables.reduce(
  (sum, { name }) =>
    sum +
    Number(
      db
        .prepare(
          `SELECT COUNT(*) AS count FROM "${name.replaceAll('"', '""')}"`,
        )
        .get().count,
    ),
  0,
);
const checkpoint = db.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
db.exec("VACUUM");
db.close();
console.log(
  JSON.stringify({
    database: target,
    tablesCleared: tables.length,
    remainingRows: remaining,
    checkpoint,
  }),
);
