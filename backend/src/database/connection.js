import { migrateTraining } from "./trainingMigration.js";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { localDatabase, remoteDatabase } from "./adapter.js";

async function connect() {
  if (process.env.NODE_ENV === "production") {
    const url = process.env.TURSO_DATABASE_URL?.trim();
    const authToken = process.env.TURSO_AUTH_TOKEN?.trim();
    if (!url || !authToken)
      throw new Error(
        "Production requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN.",
      );
    let origin;
    try {
      origin = new URL(url);
    } catch {}
    if (
      !origin ||
      !["libsql:", "turso:", "https:"].includes(origin.protocol) ||
      !origin.hostname ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      !["", "/"].includes(origin.pathname)
    )
      throw new Error("TURSO_DATABASE_URL must be a remote Turso URL.");
    const { Session } = await import("@tursodatabase/serverless");
    return remoteDatabase(
      () =>
        new Session({
          url: `https://${origin.host}`,
          authToken,
          defaultQueryTimeout: 10_000,
        }),
    );
  }
  const databasePath =
    process.env.DB_PATH ||
    fileURLToPath(new URL("../../data/forge.sqlite", import.meta.url));
  if (databasePath !== ":memory:")
    mkdirSync(dirname(databasePath), { recursive: true });
  const sqlite = new DatabaseSync(databasePath);
  sqlite.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;");
  return localDatabase(sqlite);
}
export const db = await connect();
await db.exec(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,username TEXT UNIQUE COLLATE NOCASE,password TEXT,age INTEGER,weight REAL,sex TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),expires INTEGER);
CREATE TABLE IF NOT EXISTS exercises(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),name TEXT,category TEXT,notes TEXT,ready INTEGER DEFAULT 0);
CREATE TABLE IF NOT EXISTS logs(id TEXT PRIMARY KEY,user_id TEXT REFERENCES users(id),exercise_id TEXT REFERENCES exercises(id),weight REAL,reps INTEGER,date TEXT,notes TEXT);
CREATE TABLE IF NOT EXISTS plans(id TEXT PRIMARY KEY,name TEXT,owner_id TEXT REFERENCES users(id));
CREATE TABLE IF NOT EXISTS members(plan_id TEXT REFERENCES plans(id),user_id TEXT REFERENCES users(id),accepted INTEGER DEFAULT 0,PRIMARY KEY(plan_id,user_id));`);

if (
  !(await db.prepare("PRAGMA table_info(users)").all()).some(
    (column) => column.name === "email",
  )
) {
  await db.exec("ALTER TABLE users ADD COLUMN email TEXT COLLATE NOCASE");
}
await db.exec(
  "CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users(email COLLATE NOCASE)",
);

await db.exec(
  `CREATE INDEX IF NOT EXISTS logs_user_date ON logs(user_id,date); CREATE INDEX IF NOT EXISTS exercises_user ON exercises(user_id); CREATE INDEX IF NOT EXISTS memberships_user ON members(user_id); CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`,
);

const columns = await db.prepare("PRAGMA table_info(exercises)").all();
if (!columns.some((c) => c.name === "rep_min")) {
  await db.exec(
    "ALTER TABLE exercises ADD COLUMN rep_min INTEGER DEFAULT 8; ALTER TABLE exercises ADD COLUMN rep_max INTEGER DEFAULT 12;",
  );
}

await migrateTraining(db);
for (const [name, type] of [
  ["rpe", "REAL"],
  ["rir", "INTEGER"],
]) {
  if (
    !(await db.prepare("PRAGMA table_info(log_sets)").all()).some(
      (column) => column.name === name,
    )
  ) {
    await db.exec(`ALTER TABLE log_sets ADD COLUMN ${name} ${type}`);
  }
}

// Short-lived setup records hold only a password hash until profile setup finishes.
await db.exec(
  `CREATE TABLE IF NOT EXISTS onboarding_drafts(token TEXT PRIMARY KEY,username TEXT NOT NULL,password_hash TEXT NOT NULL,expires INTEGER NOT NULL); CREATE INDEX IF NOT EXISTS onboarding_expiry ON onboarding_drafts(expires);`,
);
if (
  !(await db.prepare("PRAGMA table_info(onboarding_drafts)").all()).some(
    (column) => column.name === "email",
  )
) {
  await db.exec(
    "ALTER TABLE onboarding_drafts ADD COLUMN email TEXT COLLATE NOCASE",
  );
}

await db.exec(`CREATE TABLE IF NOT EXISTS protein_entries(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),value REAL NOT NULL,date TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '');
CREATE TABLE IF NOT EXISTS weight_entries(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),value REAL NOT NULL,date TEXT NOT NULL,label TEXT NOT NULL DEFAULT '',notes TEXT NOT NULL DEFAULT '');
CREATE INDEX IF NOT EXISTS protein_user_date ON protein_entries(user_id,date);
CREATE INDEX IF NOT EXISTS weight_user_date ON weight_entries(user_id,date);
CREATE TABLE IF NOT EXISTS account_security(user_id TEXT PRIMARY KEY REFERENCES users(id),recovery_hash TEXT);`);

await db.exec(`CREATE TABLE IF NOT EXISTS routines(
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',exercises TEXT NOT NULL);
CREATE INDEX IF NOT EXISTS routines_user ON routines(user_id);
CREATE TABLE IF NOT EXISTS training_sessions(
  id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),name TEXT NOT NULL,
  started_at INTEGER NOT NULL,finished_at INTEGER,exercises TEXT NOT NULL,
  rest_seconds INTEGER NOT NULL DEFAULT 90,rest_until INTEGER,
  notes TEXT NOT NULL DEFAULT '');
CREATE UNIQUE INDEX IF NOT EXISTS training_active_user ON training_sessions(user_id) WHERE finished_at IS NULL;`);
