import { localDate, formatDate } from "../../shared/lib/dates";
import { TrackerHistory } from "./TrackerHistory";
import type { TrackerEntry } from "./types";

export function ProteinDailyLogs({
  entries,
  onEdit,
  onDelete,
}: {
  entries: TrackerEntry[];
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (entry: TrackerEntry) => void;
}) {
  const days = new Map<string, TrackerEntry[]>();
  for (const entry of entries) {
    days.set(entry.date, [...(days.get(entry.date) || []), entry]);
  }
  return (
    <div>
      {[...days]
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([date, logs]) => (
          <details
            className="protein-daily-log"
            key={date}
            open={date === localDate()}
          >
            <summary>
              {formatDate(date)} ·{" "}
              {logs.reduce((sum, entry) => sum + entry.value, 0).toFixed(2)} g
              {" · "}
              {logs.length} {logs.length === 1 ? "entry" : "entries"}
            </summary>
            <TrackerHistory
              kind="protein"
              entries={logs}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          </details>
        ))}
    </div>
  );
}
