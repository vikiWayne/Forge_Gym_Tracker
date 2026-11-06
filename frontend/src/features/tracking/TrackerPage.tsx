import { useState } from "react";
import { Plus, Scale } from "lucide-react";
import { api } from "../../shared/api/client";
import type { User } from "../../shared/api/types";
import { useAuth } from "../../app/providers/AuthProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { ProteinIllustration } from "../protein/ProteinIllustration";
import { useTracker } from "./useTracker";
import { TrackerChart } from "./TrackerChart";
import { TrackerForm } from "./TrackerForm";
import { ProteinDailyLogs } from "./ProteinDailyLogs";
import { TrackerHistory } from "./TrackerHistory";
import { trackerConfig, type TrackerEntry, type TrackerKind } from "./types";
export function TrackerPage({ kind }: { kind: TrackerKind }) {
  const { entries, loading, error, refresh } = useTracker(kind);
  const { user, authenticate } = useAuth();
  const action = useAsyncAction();
  const [editing, setEditing] = useState<TrackerEntry | null | undefined>(
    undefined,
  );
  const [deleting, setDeleting] = useState<TrackerEntry | null>(null);
  const [range, setRange] = useState("90");
  const config = trackerConfig[kind];
  const todayTotal = entries
    .filter((entry) => entry.date === localDate())
    .reduce((total, entry) => total + entry.value, 0);
  const current =
    kind === "protein" ? todayTotal : (entries[0]?.value ?? user?.weight ?? 0);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(range));
  const filtered = entries.filter((entry) => entry.date >= localDate(cutoff));
  async function remove() {
    await api(`/${kind}/${deleting?.id}`, "DELETE");
    if (kind === "body-weight") authenticate(await api<User>("/me"));
    await refresh();
    setDeleting(null);
  }
  return (
    <>
      <PageHeader
        eyebrow={config.eyebrow}
        title={config.title}
        description={config.description}
        action={
          <button className="button primary" onClick={() => setEditing(null)}>
            <Plus size={18} />
            {config.action}
          </button>
        }
      />
      <section className={`tracker-hero tracker-${kind}`}>
        <div>
          <span className="section-kicker">
            {kind === "protein"
              ? "TODAY’S LOGGED PROTEIN"
              : entries.length
                ? "LATEST RECORDED WEIGHT"
                : "CURRENT PROFILE WEIGHT"}
          </span>
          <div className="tracker-total">
            {current.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            <span>{config.unit}</span>
          </div>
          <p>
            {kind === "protein"
              ? "A journal of what you’ve logged, without guesses or made-up targets."
              : "A record of your own measurements. Notes help keep each number in context."}
          </p>
        </div>
        {kind === "protein" ? (
          <ProteinIllustration />
        ) : (
          <span className="body-weight-symbol">
            <Scale size={72} />
            <span>✳</span>
          </span>
        )}
      </section>
      <section className="panel">
        <div className="section-head">
          <div>
            <h2>
              {kind === "protein"
                ? "Protein, day by day"
                : "Your weight over time"}
            </h2>
            <p>
              {kind === "protein"
                ? "Entries are added up into a daily total."
                : "The graph shows the latest weigh-in for each day."}
            </p>
          </div>
          <select
            aria-label="Graph time range"
            value={range}
            onChange={(event) => setRange(event.target.value)}
          >
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="36500">All time</option>
          </select>
        </div>
        {loading ? (
          <LoadingState />
        ) : (
          <TrackerChart kind={kind} entries={filtered} />
        )}
      </section>
      <ErrorMessage message={error} />
      {error && (
        <button
          className="button secondary"
          onClick={() => void action.run(refresh)}
        >
          Try again
        </button>
      )}
      <section className="panel activity-panel">
        <div className="section-head">
          <div>
            <h2>
              {kind === "protein" ? "Daily protein logs" : "Your entries"}
            </h2>
            <p>
              {entries.length} saved{" "}
              {entries.length === 1 ? "entry" : "entries"}. Edit or remove them
              anytime.
            </p>
          </div>
        </div>
        {!loading && entries.length > 0 ? (
          kind === "protein" ? (
            <ProteinDailyLogs
              entries={entries}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          ) : (
            <TrackerHistory
              kind={kind}
              entries={entries}
              onEdit={setEditing}
              onDelete={setDeleting}
            />
          )
        ) : (
          <p className="tracker-empty">
            No entries yet. Use “{config.action}” to start.
          </p>
        )}
      </section>
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit entry" : config.action}
          close={() => setEditing(undefined)}
        >
          <TrackerForm
            kind={kind}
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
          title="Delete this entry?"
          close={() => {
            setDeleting(null);
            action.clearError();
          }}
        >
          <p className="modal-description">
            This permanently removes this entry from your history and graph.
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
              onClick={() => void action.run(remove)}
            >
              Delete entry
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
