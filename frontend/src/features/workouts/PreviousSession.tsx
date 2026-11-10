import type { Log } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/dates";
export function previousSession(
  logs: Log[],
  exerciseId: string,
  date: string,
  excludeId?: string,
) {
  return logs
    .filter(
      (log) =>
        log.exercise_id === exerciseId &&
        log.id !== excludeId &&
        log.date <= date,
    )
    .sort((a, b) => b.date.localeCompare(a.date))[0];
}
export function PreviousSession({ log }: { log?: Log }) {
  return (
    <aside className="previous-session">
      <strong>Previous session{log ? ` · ${formatDate(log.date)}` : ""}</strong>
      <p>
        {log
          ? log.sets
              .map(
                (set, index) =>
                  `Set ${index + 1}: ${set.weight} kg × ${set.reps}`,
              )
              .join(" · ")
          : "No earlier session logged for this exercise yet."}
      </p>
    </aside>
  );
}
