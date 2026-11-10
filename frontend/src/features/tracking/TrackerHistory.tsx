import { Pencil, Trash2 } from "lucide-react";
import { formatDate } from "../../shared/lib/dates";
import type { TrackerEntry, TrackerKind } from "./types";
import { TrackerEntryCards } from "./TrackerEntryCards";
export function TrackerHistory({
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
    <>
      <TrackerEntryCards
        entries={entries}
        kind={kind}
        onEdit={onEdit}
        onDelete={onDelete}
      />
      <div className="table-scroll workout-desktop-table">
        <table>
          <caption className="sr-only">
            {kind === "protein" ? "Protein history" : "Body-weight history"}
          </caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{kind === "protein" ? "Protein" : "Weight"}</th>
              {kind === "protein" && <th scope="col">Source</th>}
              <th scope="col">Notes</th>
              <th scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{formatDate(entry.date)}</td>
                <td>
                  <strong>{entry.value.toFixed(2)}</strong>{" "}
                  {kind === "protein" ? "g" : "kg"}
                </td>
                {kind === "protein" && <td>{entry.label || "—"}</td>}
                <td className="notes-cell">{entry.notes || "—"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="icon-button"
                      aria-label={`Edit entry: ${formatDate(entry.date)}`}
                      onClick={() => onEdit(entry)}
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={`Delete entry: ${formatDate(entry.date)}`}
                      onClick={() => onDelete(entry)}
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
