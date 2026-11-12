import { randomBytes } from "node:crypto";
import { db } from "../../database/connection.js";
// Public handles are deliberately unrelated to the private sign-in email.
export async function availableHandle(preferred) {
  if (preferred) return preferred;
  let handle;
  do {
    handle = `lifter_${randomBytes(5).toString("hex")}`;
  } while (
    await db.prepare("SELECT id FROM users WHERE username=?").get(handle)
  );
  return handle;
}
