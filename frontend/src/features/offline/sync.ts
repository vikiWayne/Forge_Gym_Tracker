import {
  clearOffline,
  notifyOffline,
  offlineAccount,
  pendingWorkouts,
  writeOffline,
} from "./storage";
let syncing = false;
export function isSyncing() {
  return syncing;
}
export async function syncWorkouts() {
  const owner = offlineAccount();
  if (!owner || syncing || !navigator.onLine || !pendingWorkouts().length)
    return;
  syncing = true;
  notifyOffline();
  try {
    const identity = await fetch("/api/me", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (identity.status === 401) {
      clearOffline();
      window.dispatchEvent(new Event("session-expired"));
      return;
    }
    if (!identity.ok)
      throw new Error("Sign-in could not be checked. Try syncing again.");
    const user = await identity.json();
    if (user.id !== owner || offlineAccount() !== owner) {
      clearOffline();
      window.dispatchEvent(new Event("session-expired"));
      return;
    }
    for (const item of pendingWorkouts()) {
      if (offlineAccount() !== owner) return;
      try {
        const response = await fetch("/api/logs", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item.body),
        });
        if (response.status === 401) {
          clearOffline();
          window.dispatchEvent(new Event("session-expired"));
          return;
        }
        if (!response.ok) {
          const result = await response.json().catch(() => ({}));
          throw new Error(result.error || "This workout could not be synced.");
        }
        if (offlineAccount() !== owner) return;
        writeOffline(
          "queue",
          pendingWorkouts().filter((row) => row.id !== item.id),
        );
        window.dispatchEvent(new Event("forge:workout-synced"));
      } catch (cause) {
        if (offlineAccount() === owner)
          writeOffline(
            "queue",
            pendingWorkouts().map((row) =>
              row.id === item.id
                ? {
                    ...row,
                    error:
                      cause instanceof Error ? cause.message : "Sync failed.",
                  }
                : row,
            ),
          );
        break;
      }
    }
  } catch (cause) {
    if (offlineAccount() === owner) {
      const queue = pendingWorkouts();
      if (queue.length)
        writeOffline(
          "queue",
          queue.map((row, index) =>
            index === 0
              ? {
                  ...row,
                  error:
                    cause instanceof Error
                      ? cause.message
                      : "Reconnect to sync.",
                }
              : row,
          ),
        );
    }
  } finally {
    syncing = false;
    notifyOffline();
  }
}
