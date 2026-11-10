import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Ruler, Trash2 } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { formatDate } from "../../shared/lib/dates";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { PageHeader } from "../../shared/ui/PageHeader";
import { MeasurementChart } from "./MeasurementChart";
import { MeasurementForm } from "./MeasurementForm";
import {
  measurementLabels,
  type Measurement,
  type MeasurementType,
} from "./types";
import "./measurements.css";

export function MeasurementsPage() {
  const [entries, setEntries] = useState<Measurement[]>([]);
  const [selected, setSelected] = useState<MeasurementType>("waist");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<Measurement | null | undefined>();
  const [deleting, setDeleting] = useState<Measurement | null>(null);
  const action = useAsyncAction();
  const refresh = useCallback(async () => {
    const result = await api<{ entries: Measurement[] }>("/measurements");
    setEntries(result.entries);
    setLoadError("");
  }, []);
  useEffect(() => {
    void refresh()
      .catch((cause) => setLoadError(cause.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  const filtered = entries.filter((entry) => entry.type === selected);
  const latest = filtered[0];
  return (
    <>
      <PageHeader
        eyebrow="YOUR PERSONAL MEASUREMENT JOURNAL"
        title="Progress has more than one shape."
        description="Keep private records of your waist, chest, arms and other measurements. All values are in centimeters."
        action={
          <button className="button primary" onClick={() => setEditing(null)}>
            <Plus size={17} />
            Log measurement
          </button>
        }
      />
      <ErrorMessage message={loadError || action.error} />
      {loadError && (
        <button
          className="button secondary"
          onClick={() => void action.run(refresh)}
        >
          Try again
        </button>
      )}
      <section className="panel measurement-overview">
        <div>
          <span className="panel-icon">
            <Ruler size={24} />
          </span>
          <h2>{measurementLabels[selected]}</h2>
          <strong className="measurement-value">
            {latest ? `${latest.value.toFixed(2)} cm` : "No entry yet"}
          </strong>
          <p>
            {latest
              ? `Latest entry · ${formatDate(latest.date)}`
              : "Log an entry for this area whenever you choose."}
          </p>
        </div>
        <label>
          Area to review
          <select
            value={selected}
            onChange={(event) =>
              setSelected(event.target.value as MeasurementType)
            }
          >
            {Object.entries(measurementLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label} (
                {entries.filter((entry) => entry.type === value).length})
              </option>
            ))}
          </select>
        </label>
      </section>
      <section className="panel measurement-history">
        <div className="section-head">
          <div>
            <h2>{measurementLabels[selected]} over time</h2>
            <p>The graph uses your latest entry for each date.</p>
          </div>
          <span className="count-tag">
            {filtered.length} {filtered.length === 1 ? "entry" : "entries"}
          </span>
        </div>
        {loading ? <LoadingState /> : <MeasurementChart entries={filtered} />}
        <p className="field-hint">
          Measurements are personal records, not a score. Keep your measuring
          method consistent when comparing entries. These records stay private
          and never appear in Together.
        </p>
      </section>
      <section className="panel measurement-history">
        <h2>Saved {measurementLabels[selected].toLowerCase()} measurements</h2>
        {filtered.length ? (
          <div className="table-scroll">
            <table className="responsive-entry-table">
              <caption className="sr-only">
                Measurement history with date, centimeters and notes
              </caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Size</th>
                  <th>Notes</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Date">{formatDate(entry.date)}</td>
                    <td data-label="Measurement">
                      {entry.value.toFixed(2)} cm
                    </td>
                    <td data-label="Notes" className="measurement-notes">
                      {entry.notes || "—"}
                    </td>
                    <td data-label="Actions">
                      <div className="row-actions">
                        <button
                          className="icon-button"
                          aria-label={`Edit ${measurementLabels[entry.type]} on ${entry.date}`}
                          onClick={() => setEditing(entry)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="icon-button"
                          aria-label={`Delete ${measurementLabels[entry.type]} on ${entry.date}`}
                          onClick={() => {
                            action.clearError();
                            setDeleting(entry);
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="measurement-empty">
            {loading
              ? "Loading measurements…"
              : "No saved entries for this area. Choose another area above or log your first measurement."}
          </p>
        )}
      </section>
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit measurement" : "Log body measurement"}
          close={() => setEditing(undefined)}
        >
          <MeasurementForm
            entry={editing || undefined}
            initialType={selected}
            onSaved={async () => {
              await refresh();
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this measurement?" close={() => setDeleting(null)}>
          <p>
            This permanently removes this measurement from your history and
            graph.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep measurement
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(`/measurements/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              Delete measurement
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
