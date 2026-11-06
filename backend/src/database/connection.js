import { migrateTraining } from "./trainingMigration.js";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
mkdirSync(new URL("../../data/", import.meta.url), { recursive: true });
export const db = new DatabaseSync(
  process.env.DB_PATH ||
    fileURLToPath(new URL("../../data/forge.sqlite", import.meta.url)),
);
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,password TEXT,age INTEGER,weight REAL,sex TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS exercises(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),name TEXT,category TEXT,notes TEXT,ready INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS logs(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),exercise_id TEXT REFERENCES exercises(id),weight REAL,reps INTEGER,date TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,name TEXT,owner_id TEXT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS members(plan_id TEXT REFERENCES plans(id),user_id TEXT REFERENCES users(id),accepted INTEGER DEFAULT 0,PRIMARY KEY(plan_id,user_id));`);

db.exec(
  `CREATE INDEX IF NOT EXISTS logs_user_date ON logs(user_id,date); CREATE INDEX IF NOT EXISTS exercises_user ON exercises(user_id); CREATE INDEX IF NOT EXISTS memberships_user ON members(user_id); CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`,
);

const columns = db.prepare("PRAGMA table_info(exercises)").all();
if (!columns.some((c) => c.name === "rep_min")) {
  db.exec(
    "ALTER TABLE exercises ADD COLUMN rep_min INTEGER DEFAULT 8; ALTER TABLE exercises ADD COLUMN rep_max INTEGER DEFAULT 12;",
  );
}

migrateTraining(db);
