import { AsyncLocalStorage } from "node:async_hooks";

export function databaseAdapter(driver) {
  const context = new AsyncLocalStorage();
  let pending = Promise.resolve();

  // A local SQLite connection must not run another request's query mid-transaction.
  function schedule(work) {
    if (!driver.serial) return work();
    const next = pending.then(work);
    pending = next.catch(() => {});
    return next;
  }

  function query(work) {
    const transaction = context.getStore();
    return transaction ? work(transaction) : schedule(() => work(driver));
  }

  return {
    prepare(sql) {
      const execute = (args, write = false) =>
        query((connection) => connection.execute(sql, args, write));
      return {
        async get(...args) {
          return (await execute(args)).rows[0];
        },
        async all(...args) {
          return (await execute(args)).rows;
        },
        async run(...args) {
          const result = await execute(args, true);
          return {
            changes: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid,
          };
        },
      };
    },
    exec(sql) {
      return query((connection) => connection.exec(sql));
    },
    batch(statements) {
      const transaction = context.getStore();
      if (!transaction) throw new Error("Batch writes require a transaction.");
      return transaction.batch(statements);
    },
    transaction(work) {
      if (context.getStore()) return work();
      return schedule(() =>
        driver.transaction((connection) => context.run(connection, work)),
      );
    },
    close() {
      return driver.close();
    },
  };
}

export function localDatabase(sqlite) {
  const connection = {
    serial: true,
    execute(sql, args, write) {
      const statement = sqlite.prepare(sql);
      if (!write) return { rows: statement.all(...args) };
      const result = statement.run(...args);
      return {
        rows: [],
        rowsAffected: result.changes,
        lastInsertRowid: result.lastInsertRowid,
      };
    },
    exec: (sql) => sqlite.exec(sql),
    batch(statements) {
      for (const { sql, args } of statements) sqlite.prepare(sql).run(...args);
    },
    close: () => sqlite.close(),
    async transaction(work) {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const result = await work(connection);
        sqlite.exec("COMMIT");
        return result;
      } catch (error) {
        sqlite.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return databaseAdapter(connection);
}

export function remoteDatabase(openSession) {
  async function withSession(work) {
    const session = openSession();
    try {
      return await work(session);
    } finally {
      await session.close();
    }
  }
  const execute = async (session, sql, args, enableForeignKeys = false) => {
    const statement = { sql, args };
    const results = await session.batch(
      enableForeignKeys ? ["PRAGMA foreign_keys=ON", statement] : [statement],
    );
    return results.at(-1);
  };
  return databaseAdapter({
    execute: (sql, args, write) =>
      withSession((session) => execute(session, sql, args, write)),
    exec: (sql) =>
      withSession((session) =>
        session.sequence(`PRAGMA foreign_keys=ON;\n${sql}`),
      ),
    close() {},
    transaction(work) {
      return withSession(async (session) => {
        // Pragmas are scoped to the stream and must be enabled before BEGIN.
        await session.sequence("PRAGMA foreign_keys=ON; BEGIN IMMEDIATE;");
        let pending = Promise.resolve();
        const enqueue = (operation) => {
          pending = pending.then(operation);
          return pending;
        };
        try {
          const result = await work({
            execute: (sql, args) => enqueue(() => execute(session, sql, args)),
            exec: (sql) => enqueue(() => session.sequence(sql)),
            batch: (statements) => enqueue(() => session.batch(statements)),
          });
          await pending;
          await session.sequence("COMMIT");
          return result;
        } catch (error) {
          await pending.catch(() => {});
          if (session.inTransaction)
            await session.sequence("ROLLBACK").catch(() => {});
          throw error;
        }
      });
    },
  });
}
