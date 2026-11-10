import { SetSummary } from "./SetSummary";
import { WorkoutMobileCards } from "./WorkoutMobileCards";
import { Copy, Pencil, Trash2, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";
import type { Exercise, Log } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/dates";
export function WorkoutTable({
  logs,
  exercises,
  onDelete,
}: {
  logs: Log[];
  exercises: Exercise[];
  onDelete?: (log: Log) => void;
}) {
  return (
    <>
      <WorkoutMobileCards
        logs={logs}
        exercises={exercises}
        onDelete={onDelete}
      />
      <div className="table-scroll workout-desktop-table">
        <table>
          <caption className="sr-only">
            Logged workouts with date, individual sets and notes
          </caption>
          <thead>
            <tr>
              <th scope="col">Movement</th>
              <th scope="col">Date</th>
              <th scope="col">Sets · weight × reps</th>
              <th scope="col">Notes</th>
              {onDelete && (
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>
                  <span className="table-movement">
                    <span className="table-movement-icon">
                      <Dumbbell size={16} />
                    </span>
                    {exercises.find((e) => e.id === log.exercise_id)?.name ||
                      "Exercise"}
                  </span>
                </td>
                <td>
                  {formatDate(log.date)}
                  {log.pending_sync && (
                    <span className="count-tag" role="status">
                      Waiting to sync
                    </span>
                  )}
                </td>
                <td>
                  <SetSummary sets={log.sets} />
                </td>
                <td className="notes-cell">{log.notes || "—"}</td>
                {onDelete && (
                  <td>
                    <div className="row-actions">
                      {!log.pending_sync && (
                        <>
                          <Link
                            className="icon-button"
                            aria-label={`Copy workout: ${formatDate(log.date)}`}
                            title="Copy workout"
                            to={`/workouts/new?copy=${encodeURIComponent(log.id)}`}
                          >
                            <Copy size={16} />
                          </Link>
                          <Link
                            className="icon-button"
                            aria-label={`Edit workout: ${formatDate(log.date)}`}
                            to={`/workouts/${log.id}/edit`}
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            className="icon-button"
                            aria-label={`Delete workout: ${formatDate(log.date)}`}
                            onClick={() => onDelete(log)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
