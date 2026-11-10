import { Copy, Pencil, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Exercise, Log } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/dates";
import { SetSummary } from "./SetSummary";
export function WorkoutMobileCards({
  logs,
  exercises,
  onDelete,
}: {
  logs: Log[];
  exercises: Exercise[];
  onDelete?: (log: Log) => void;
}) {
  return (
    <div className="mobile-workout-list">
      {logs.map((log) => (
        <article className="workout-mobile-card" key={log.id}>
          <div className="workout-mobile-head">
            <div>
              <h3>
                {log.name ||
                  exercises.find((exercise) => exercise.id === log.exercise_id)
                    ?.name ||
                  "Workout"}
              </h3>
              <p>
                {log.username ? log.username + " · " : ""}
                {formatDate(log.date)}
              </p>
            </div>
            <span>
              {log.pending_sync
                ? "Waiting to sync"
                : log.sets.length + (log.sets.length === 1 ? " set" : " sets")}
            </span>
          </div>
          {log.sets.length <= 3 ? (
            <SetSummary sets={log.sets} />
          ) : (
            <details>
              <summary>View all {log.sets.length} sets</summary>
              <SetSummary sets={log.sets} />
            </details>
          )}
          {log.notes && (
            <details>
              <summary>Session notes</summary>
              <p>{log.notes}</p>
            </details>
          )}
          {onDelete && !log.pending_sync && (
            <div className="workout-mobile-actions">
              <Link
                className="button secondary"
                to={"/workouts/new?copy=" + log.id}
              >
                <Copy size={15} />
                Copy workout
              </Link>
              <Link
                className="icon-button"
                aria-label={"Edit workout: " + formatDate(log.date)}
                to={"/workouts/" + log.id + "/edit"}
              >
                <Pencil size={17} />
              </Link>
              <button
                type="button"
                className="icon-button"
                aria-label={"Delete workout: " + formatDate(log.date)}
                onClick={() => onDelete(log)}
              >
                <Trash2 size={17} />
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
