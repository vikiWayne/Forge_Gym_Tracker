import { app } from "./app.js";
import { db } from "./database/connection.js";

const port = Number(process.env.PORT || 3001);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const host = process.env.HOST || "127.0.0.1";
const server = app.listen(port, host, () => {
  console.log(`FORGE listening on ${host}:${port}`);
});
for (const signal of ["SIGTERM", "SIGINT"]) {
  process.once(signal, () => {
    server.close(() => {
      db.close();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
