import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { db } from "../../database/connection.js";
export function recoveryHash(code) {
  return createHash("sha256")
    .update(code.toUpperCase().replace(/[^A-Z0-9]/g, ""))
    .digest("hex");
}
const unavailableHash = recoveryHash(randomBytes(32).toString("hex"));
export async function issueRecoveryCode(userId) {
  const raw = randomBytes(16).toString("hex").toUpperCase();
  const code = `FORGE-${raw.match(/.{8}/g).join("-")}`;
  await db
    .prepare(
      "INSERT INTO account_security VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET recovery_hash=excluded.recovery_hash",
    )
    .run(userId, recoveryHash(code));
  return code;
}
export function verifyRecovery(code, hash) {
  const matches = timingSafeEqual(
    Buffer.from(recoveryHash(code), "hex"),
    Buffer.from(hash || unavailableHash, "hex"),
  );
  return Boolean(hash) && matches;
}
