import { useState } from "react";
import { Modal } from "../../shared/ui/Modal";
import { pendingWorkouts, writeOffline } from "./storage";
export function OfflineQueue() {
  const [removing, setRemoving] = useState<string | null>(null);
  const queue = pendingWorkouts();
  return (
    <>
      <details className="offline-queue">
        <summary>
          Review {queue.length} queued{" "}
          {queue.length === 1 ? "workout" : "workouts"}
        </summary>
        <ul>
          {queue.map((item) => (
            <li key={item.id}>
              <div>
                <strong>{String(item.body.date)}</strong>
                <p>
                  {Array.isArray(item.body.sets) ? item.body.sets.length : 0}{" "}
                  sets · {item.error || "Waiting to sync"}
                </p>
              </div>
              <button
                type="button"
                className="button subtle"
                onClick={() => setRemoving(item.id)}
              >
                Remove from queue
              </button>
            </li>
          ))}
        </ul>
      </details>
      {removing && (
        <Modal
          title="Remove this unsynced workout?"
          close={() => setRemoving(null)}
        >
          <p>
            This removes the device copy from the sync queue. If the server
            already received it before the connection dropped, its saved journal
            entry remains.
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setRemoving(null)}
            >
              Keep queued
            </button>
            <button
              className="button danger"
              onClick={() => {
                writeOffline(
                  "queue",
                  pendingWorkouts().filter((item) => item.id !== removing),
                );
                setRemoving(null);
                window.dispatchEvent(new Event("forge:workout-synced"));
              }}
            >
              Remove from queue
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
