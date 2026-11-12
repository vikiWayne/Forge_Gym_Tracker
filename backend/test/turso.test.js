import assert from "node:assert/strict";
import { test } from "node:test";
import { DatabaseSync } from "node:sqlite";

test("production requires Turso and reconnecting preserves rows, blobs and foreign keys", async (t) => {
  process.env.NODE_ENV = "production";
  process.env.DB_PATH = ":memory:";
  delete process.env.TURSO_DATABASE_URL;
  delete process.env.TURSO_AUTH_TOKEN;
  await assert.rejects(
    import("../src/database/connection.js?missing-credentials"),
    /Production requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN/,
  );

  process.env.TURSO_DATABASE_URL = "libsql://forge-test.invalid";
  process.env.TURSO_AUTH_TOKEN = "test-token";
  const sqlite = new DatabaseSync(":memory:");
  t.after(() => sqlite.close());
  const encode = (value) => {
    if (value === null) return { type: "null" };
    if (value instanceof Uint8Array)
      return { type: "blob", base64: Buffer.from(value).toString("base64") };
    if (Number.isInteger(value))
      return { type: "integer", value: String(value) };
    if (typeof value === "number") return { type: "float", value };
    return { type: "text", value };
  };
  const decode = (value) => {
    if (value.type === "null") return null;
    if (value.type === "blob") return Buffer.from(value.base64, "base64");
    if (value.type === "integer") return Number(value.value);
    return value.value;
  };
  const success = (type, fields) => ({
    type: "ok",
    response: { type, ...fields },
  });
  let nextBaton = 0;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "https://forge-test.invalid/v3/pipeline");
    assert.equal(
      new Headers(options.headers).get("authorization"),
      "Bearer test-token",
    );
    const { baton, requests } = JSON.parse(options.body);
    if (!baton) sqlite.exec("PRAGMA foreign_keys=OFF");
    const results = requests.map((request) => {
      if (request.type === "get_autocommit")
        return success(request.type, { is_autocommit: !sqlite.isTransaction });
      if (request.type === "close") return success(request.type);
      if (request.type === "sequence") {
        sqlite.exec(request.sql);
        return success(request.type);
      }
      assert.equal(request.type, "batch");
      const step_results = [],
        step_errors = [];
      for (const { stmt, condition } of request.batch.steps) {
        if (condition && !step_results[condition.step]) {
          step_results.push(null);
          step_errors.push(null);
          continue;
        }
        try {
          const query = sqlite.prepare(stmt.sql);
          const args = stmt.args.map(decode);
          const columns = query.columns();
          const rows = columns.length ? query.all(...args) : [];
          const write = columns.length ? null : query.run(...args);
          step_results.push({
            cols: columns.map(({ name, type }) => ({ name, decltype: type })),
            rows: rows.map((row) =>
              columns.map(({ name }) => encode(row[name])),
            ),
            affected_row_count: write?.changes ?? 0,
            last_insert_rowid: write ? String(write.lastInsertRowid) : null,
          });
          step_errors.push(null);
        } catch (error) {
          step_results.push(null);
          step_errors.push({
            code: "SQLITE_CONSTRAINT",
            message: error.message,
          });
        }
      }
      return success(request.type, { result: { step_results, step_errors } });
    });
    return Response.json({
      baton: requests.some((request) => request.type === "close")
        ? null
        : (baton ?? String(++nextBaton)),
      results,
    });
  });

  await import("../src/app.js");
  const { db } = await import("../src/database/connection.js");
  await db.exec(
    "CREATE TABLE test_payload(user_id TEXT REFERENCES users(id) ON DELETE CASCADE, bytes BLOB)",
  );
  await db
    .prepare("INSERT INTO users(id,username,password) VALUES(?,?,?)")
    .run("owner", "tester", "fake-hash");
  await assert.rejects(
    db
      .prepare("INSERT INTO test_payload VALUES(?,?)")
      .run("missing", Buffer.from([1])),
    /FOREIGN KEY/,
  );
  await assert.rejects(
    db.transaction(async () => {
      await db
        .prepare("INSERT INTO test_payload VALUES(?,?)")
        .run("owner", Buffer.from([2]));
      throw new Error("abort workout");
    }),
    /abort workout/,
  );
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS total FROM test_payload").get())
      .total,
    0,
  );
  await db.transaction(() =>
    db.batch([
      {
        sql: "INSERT INTO test_payload VALUES(?,?)",
        args: ["owner", Buffer.from([3, 4])],
      },
    ]),
  );

  const { db: restarted } =
    await import("../src/database/connection.js?second-deploy");
  assert.equal(
    (
      await restarted
        .prepare("SELECT username FROM users WHERE id=?")
        .get("owner")
    ).username,
    "tester",
  );
  const { bytes } = await restarted
    .prepare("SELECT bytes FROM test_payload WHERE user_id=?")
    .get("owner");
  assert.deepEqual(Buffer.from(bytes), Buffer.from([3, 4]));
  await restarted.prepare("DELETE FROM users WHERE id=?").run("owner");
  assert.equal(
    (
      await restarted
        .prepare("SELECT COUNT(*) AS total FROM test_payload")
        .get()
    ).total,
    0,
  );
  const calls = fetch.mock.callCount();
  process.env.NODE_ENV = "test";
  const { db: local } = await import("../src/database/connection.js?local");
  assert.equal(
    (await local.prepare("SELECT COUNT(*) AS total FROM users").get()).total,
    0,
  );
  assert.equal(fetch.mock.callCount(), calls);
  local.close();
});
