import { randomUUID } from "node:crypto";
export function migrateTraining(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL COLLATE NOCASE,UNIQUE(user_id,name));
    CREATE TABLE IF NOT EXISTS log_sets(log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,position INTEGER NOT NULL,weight REAL NOT NULL,reps INTEGER NOT NULL,PRIMARY KEY(log_id,position));`);
  const columns = db.prepare("PRAGMA table_info(exercises)").all();
  if (!columns.some((column) => column.name === "category_id")) {
    db.exec("BEGIN");
    try {
      db.exec(
        "ALTER TABLE exercises ADD COLUMN category_id TEXT REFERENCES categories(id)",
      );
      for (const row of db
        .prepare("SELECT DISTINCT user_id, category FROM exercises")
        .all()) {
        db.prepare("INSERT OR IGNORE INTO categories VALUES(?,?,?)").run(
          randomUUID(),
          row.user_id,
          row.category,
        );
        const category = db
          .prepare("SELECT id FROM categories WHERE user_id=? AND name=?")
          .get(row.user_id, row.category);
        db.prepare(
          "UPDATE exercises SET category_id=? WHERE user_id=? AND category=?",
        ).run(category.id, row.user_id, row.category);
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
  // Every existing log is a real, single-set workout. Preserve it as set one.
  db.exec(`INSERT INTO log_sets(log_id,position,weight,reps) SELECT id,1,weight,reps FROM logs WHERE NOT EXISTS(SELECT 1 FROM log_sets WHERE log_id=logs.id);
    CREATE INDEX IF NOT EXISTS categories_user ON categories(user_id);`);
}
