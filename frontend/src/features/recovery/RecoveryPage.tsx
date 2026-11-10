import { useCallback, useEffect, useState } from "react";
import { Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { formatDate } from "../../shared/lib/dates";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { PageHeader } from "../../shared/ui/PageHeader";
import { RecoveryForm } from "./RecoveryForm";
import { RecoveryChart } from "./RecoveryChart";
import { recoveryRatings, type RecoveryEntry } from "./types";
import "./recovery.css";
export function RecoveryPage() {
  const [entries, setEntries] = useState<RecoveryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<RecoveryEntry | null | undefined>();
  const [deleting, setDeleting] = useState<RecoveryEntry | null>(null);
  const action = useAsyncAction();
  const refresh = useCallback(async () => {
    const result = await api<{ entries: RecoveryEntry[] }>("/recovery");
    setEntries(result.entries);
    setError("");
  }, []);
  useEffect(() => {
    void refresh()
      .catch((cause) => setError(cause.message))
      .finally(() => setLoading(false));
  }, [refresh]);
  return (
    <>
      <PageHeader
        eyebrow="YOUR PRIVATE RECOVERY JOURNAL"
        title="Check in with yourself."
        description="Keep sleep, energy, soreness and mood alongside your training story. These are your observations, not a score."
        action={
          <button className="button primary" onClick={() => setEditing(null)}>
            <Plus size={17} />
            Log recovery
          </button>
        }
      />
      <ErrorMessage message={error || action.error} />
      {error && (
        <button
          className="button secondary"
          onClick={() => void action.run(refresh)}
        >
          Try again
        </button>
      )}
      <section className="panel recovery-trends">
        <div className="section-head">
          <div>
            <h2>Your recent rhythm</h2>
            <p>Your last 30 logged dates. Gaps in logging are not filled in.</p>
          </div>
          <span className="panel-icon">
            <Heart size={23} />
          </span>
        </div>
        {loading ? <LoadingState /> : <RecoveryChart entries={entries} />}
        <p className="field-hint">
          Ratings run from 1 to 5. Higher energy and mood mean more positive
          ratings; higher soreness means more soreness. Only you can see this
          journal.
        </p>
      </section>
      <section className="recovery-timeline" aria-label="Recovery timeline">
        <h2>Your check-ins</h2>
        {!loading && !entries.length && (
          <p className="recovery-empty">
            No check-ins yet. Log a date whenever you want to remember how you
            felt.
          </p>
        )}
        {entries.map((entry) => (
          <article className="panel recovery-entry" key={entry.id}>
            <div className="section-head">
              <h3>{formatDate(entry.date)}</h3>
              <div className="row-actions">
                <button
                  className="icon-button"
                  aria-label={`Edit recovery on ${entry.date}`}
                  onClick={() => setEditing(entry)}
                >
                  <Pencil size={16} />
                </button>
                <button
                  className="icon-button"
                  aria-label={`Delete recovery on ${entry.date}`}
                  onClick={() => {
                    action.clearError();
                    setDeleting(entry);
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <dl className="recovery-metrics">
              <div>
                <dt>Sleep</dt>
                <dd>{entry.sleep_hours} hours</dd>
              </div>
              {Object.entries(recoveryRatings).map(([name, labels]) => (
                <div key={name}>
                  <dt>
                    {name === "energy"
                      ? "Energy"
                      : name === "soreness"
                        ? "Soreness"
                        : "Mood"}
                  </dt>
                  <dd>
                    {entry[name as keyof typeof recoveryRatings]}/5 ·{" "}
                    {labels[entry[name as keyof typeof recoveryRatings] - 1]}
                  </dd>
                </div>
              ))}
            </dl>
            {entry.notes && <p className="recovery-notes">{entry.notes}</p>}
          </article>
        ))}
      </section>
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit recovery entry" : "Log recovery"}
          close={() => setEditing(undefined)}
        >
          <RecoveryForm
            entry={editing || undefined}
            onSaved={async () => {
              await refresh();
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete this recovery entry?"
          close={() => setDeleting(null)}
        >
          <p>
            This permanently removes the check-in from your private timeline and
            trend graph.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep entry
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(`/recovery/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              Delete entry
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
