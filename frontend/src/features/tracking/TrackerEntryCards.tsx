import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../../shared/lib/dates";
import type { TrackerEntry, TrackerKind } from "./types";
export function TrackerEntryCards({
  entries,
  kind,
  onEdit,
  onDelete,
}: {
  entries: TrackerEntry[];
  kind: TrackerKind;
  onEdit: (entry: TrackerEntry) => void;
  onDelete: (entry: TrackerEntry) => void;
}) {
  return (
    <div className="mobile-workout-list tracker-entry-cards">
      {entries.map((entry) => (
        <article className="workout-mobile-card" key={entry.id}>
          <div className="tracker-entry-top">
            <div>
              <h3>
                {kind === "protein"
                  ? entry.label || "Protein entry"
                  : "Body weight"}
              </h3>
              <p>{formatDate(entry.date)}</p>
            </div>
            <strong>
              {entry.value.toFixed(2)}{" "}
              <small>{kind === "protein" ? "g" : "kg"}</small>
            </strong>
          </div>
          {entry.notes && <p className="tracker-entry-notes">{entry.notes}</p>}
          <div className="workout-mobile-actions">
            <button
              type="button"
              className="button secondary"
              onClick={() => onEdit(entry)}
            >
              <Pencil size={15} />
              Edit entry
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={"Delete entry: " + formatDate(entry.date)}
              onClick={() => onDelete(entry)}
            >
              <Trash2 size={17} />
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
