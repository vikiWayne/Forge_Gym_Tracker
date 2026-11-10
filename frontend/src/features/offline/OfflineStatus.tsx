import { useEffect, useState } from "react";
import { offlineEvent, pendingWorkouts } from "./storage";
import { isSyncing, syncWorkouts } from "./sync";
import "./offline.css";
import { OfflineQueue } from "./OfflineQueue";
export function OfflineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [, render] = useState(0);
  useEffect(() => {
    const update = () => {
      setOnline(navigator.onLine);
      render((value) => value + 1);
    };
    const reconnect = () => {
      update();
      void syncWorkouts();
    };
    window.addEventListener("online", reconnect);
    window.addEventListener("offline", update);
    window.addEventListener(offlineEvent, update);
    void syncWorkouts();
    return () => {
      window.removeEventListener("online", reconnect);
      window.removeEventListener("offline", update);
      window.removeEventListener(offlineEvent, update);
    };
  }, []);
  const queue = pendingWorkouts();
  if (online && !queue.length) return null;
  return (
    <aside className="offline-status">
      <div>
        <strong>
          {online
            ? `${queue.length} workout${queue.length === 1 ? "" : "s"} waiting to sync`
            : "You’re offline"}
        </strong>
        <p>
          {!online
            ? "New workout logs are saved on this device. Reconnect to sync. Account, sharing and security changes need a connection."
            : isSyncing()
              ? "Syncing your saved workouts…"
              : queue.find((item) => item.error)?.error ||
                "Your saved workouts will sync to this account."}
        </p>
      </div>
      {queue.length > 0 && <OfflineQueue />}
      {online && (
        <button
          type="button"
          className="button secondary"
          disabled={isSyncing()}
          onClick={() => void syncWorkouts()}
        >
          Retry sync
        </button>
      )}
    </aside>
  );
}
