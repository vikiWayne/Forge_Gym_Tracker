import type { User } from "../../shared/api/types";
export type PendingWorkout = {
  id: string;
  body: Record<string, unknown>;
  error?: string;
};
const PREFIX = "forge-offline-v1:";
const SIGNED_OUT = "forge-local-signout";
let account: string | null = null;
export const offlineEvent = "forge:offline-change";
export function notifyOffline() {
  window.dispatchEvent(new Event(offlineEvent));
}
export function offlineAccount() {
  return account;
}
export function readOffline<T>(name: string): T | null {
  if (!account) return null;
  try {
    return JSON.parse(
      localStorage.getItem(`${PREFIX}${account}:${name}`) || "null",
    ) as T | null;
  } catch {
    return null;
  }
}
export function writeOffline(name: string, value: unknown) {
  if (!account) throw new Error("Sign in before saving an offline workout.");
  localStorage.setItem(`${PREFIX}${account}:${name}`, JSON.stringify(value));
  notifyOffline();
}
export function cachedUser(): User | null {
  try {
    const saved = JSON.parse(localStorage.getItem(`${PREFIX}auth`) || "null");
    return saved && Date.now() - saved.verifiedAt < 7 * 86400000
      ? saved.user
      : null;
  } catch {
    return null;
  }
}
export function setOfflineUser(user: User, verified = true) {
  if (account && account !== user.id) clearOffline();
  account = user.id;
  if (verified) {
    try {
      localStorage.removeItem(SIGNED_OUT);
      localStorage.setItem(
        `${PREFIX}auth`,
        JSON.stringify({ user, verifiedAt: Date.now() }),
      );
    } catch {}
  }
  notifyOffline();
}
export function locallySignedOut() {
  try {
    return localStorage.getItem(SIGNED_OUT) === "1";
  } catch {
    return false;
  }
}
export function signOutLocally() {
  clearOffline();
  try {
    localStorage.setItem(SIGNED_OUT, "1");
  } catch {}
}
export function clearOffline() {
  account = null;
  try {
    for (const key of Object.keys(localStorage))
      if (key.startsWith(PREFIX)) localStorage.removeItem(key);
  } catch {}
  notifyOffline();
}
export function pendingWorkouts() {
  return readOffline<PendingWorkout[]>("queue") || [];
}
export function enqueueWorkout(id: string, body: Record<string, unknown>) {
  const queue = pendingWorkouts();
  if (!queue.some((item) => item.id === id))
    writeOffline("queue", [...queue, { id, body }]);
}
