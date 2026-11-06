import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
// Equalize password verification work for unknown usernames without creating any account.
const unavailableHash = hashPassword(randomBytes(32).toString("hex"));
export function verifyPassword(password, storedHash) {
  const [salt, expected] = (storedHash || unavailableHash).split(":");
  const matches = timingSafeEqual(
    scryptSync(password, salt, 64),
    Buffer.from(expected, "hex"),
  );
  return Boolean(storedHash) && matches;
}
