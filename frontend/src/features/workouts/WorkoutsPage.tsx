import { WorkoutCsvActions } from "./WorkoutCsvActions";
import { useState } from "react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { Log } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState, ErrorMessage } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { WorkoutTable } from "./WorkoutTable";
export function WorkoutsPage() {
  const { logs, exercises, refresh } = useTraining();
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<Log | null>(null);
  const { pending, error, run, clearError } = useAsyncAction();
  const filtered = logs.filter((l) =>
    (exercises.find((e) => e.id === l.exercise_id)?.name || "")
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        eyebrow="YOUR EFFORT, ON THE RECORD"
        title="Look at you, showing up."
        description="Every lift has a story. Keep yours here."
      />
      <WorkoutCsvActions />
      {logs.length ? (
        <section className="panel">
          <div className="section-head">
            <div>
              <h2>
                Your workout journal{" "}
                <span className="count-tag">{logs.length}</span>
              </h2>
              <p>The work you put in, all in one place.</p>
            </div>
            <input
              aria-label="Search workout logs"
              placeholder="Find an exercise…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filtered.length ? (
            <WorkoutTable
              logs={filtered}
              exercises={exercises}
              onDelete={setDeleting}
            />
          ) : (
            <EmptyState title="No workouts found.">
              Try another movement name.
            </EmptyState>
          )}
        </section>
      ) : (
        <EmptyState
          title="Your next chapter starts with a rep."
          to={exercises.length ? undefined : "/exercises"}
          action={exercises.length ? undefined : "Add your first exercise"}
        >
          {exercises.length
            ? "Use Log workout in the navigation to record your first session. Your real history will appear here."
            : "Add an exercise, then use Log workout in the navigation to record your first session."}
        </EmptyState>
      )}
      {deleting && (
        <Modal
          title="Remove this workout?"
          close={() => {
            setDeleting(null);
            clearError();
          }}
        >
          <p className="modal-description">
            This permanently removes this workout from your journal and progress
            charts.
          </p>
          <ErrorMessage message={error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep workout
            </button>
            <button
              className="button danger"
              disabled={pending}
              onClick={() =>
                void run(async () => {
                  await api(`/logs/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              {pending ? "Removing…" : "Delete workout"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
