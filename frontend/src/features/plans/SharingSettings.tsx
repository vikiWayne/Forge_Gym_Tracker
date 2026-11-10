import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import type { Plan } from "../../shared/api/types";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import "./sharing.css";

export function SharingSettings({ plan }: { plan: Plan }) {
  const { logs, exercises, refresh } = useTraining();
  const initial = plan.sharing || {
    mode: "none" as const,
    include_notes: false,
    selected_log_ids: [],
  };
  const [mode, setMode] = useState(initial.mode);
  const [notes, setNotes] = useState(initial.include_notes);
  const [selected, setSelected] = useState<string[]>(initial.selected_log_ids);
  const [saved, setSaved] = useState(false);
  const action = useAsyncAction();
  const validSelection = selected.filter((id) =>
    logs.some((log) => log.id === id),
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaved(false);
    void action.run(async () => {
      await api(`/plans/${plan.id}/sharing`, "PUT", {
        mode,
        include_notes: notes,
        selected_log_ids: validSelection,
      });
      await refresh();
      setSaved(true);
    });
  }
  return (
    <details className="sharing-settings">
      <summary>
        <ShieldCheck size={18} />
        Your sharing preferences{" "}
        <span>
          {plan.sharing?.mode === "all"
            ? "All workouts"
            : plan.sharing?.mode === "selected"
              ? "Selected workouts"
              : "Workouts private"}
        </span>
      </summary>
      <form onSubmit={submit}>
        <p>
          Choose what accepted members of this plan can see. Changes apply to
          existing shared history and future access. Your own workouts always
          remain visible to you.
        </p>
        <label>
          Workouts to share
          <select
            value={mode}
            disabled={action.pending}
            onChange={(event) => {
              setMode(event.target.value as typeof mode);
              setSaved(false);
            }}
          >
            <option value="none">None — keep my workouts private</option>
            <option value="selected">Only workouts I select</option>
            <option value="all">All historical and future workouts</option>
          </select>
        </label>
        {mode === "selected" && (
          <fieldset className="sharing-log-list">
            <legend>
              Select journal workouts ({validSelection.length}/1000)
            </legend>
            {logs.length ? (
              logs.map((log) => (
                <label key={log.id} className="sharing-checkbox">
                  <input
                    type="checkbox"
                    checked={validSelection.includes(log.id)}
                    disabled={
                      action.pending ||
                      (!validSelection.includes(log.id) &&
                        validSelection.length >= 1000)
                    }
                    onChange={(event) => {
                      setSelected(
                        event.target.checked
                          ? [...validSelection, log.id]
                          : validSelection.filter((id) => id !== log.id),
                      );
                      setSaved(false);
                    }}
                  />
                  <span>
                    <strong>
                      {exercises.find(
                        (exercise) => exercise.id === log.exercise_id,
                      )?.name || "Exercise"}
                    </strong>
                    <small>
                      {formatDate(log.date)} · {log.sets.length}{" "}
                      {log.sets.length === 1 ? "set" : "sets"}
                    </small>
                  </span>
                </label>
              ))
            ) : (
              <p>
                No saved workouts yet. New workouts remain private until
                selected here.
              </p>
            )}
          </fieldset>
        )}
        <label className="sharing-checkbox">
          <input
            type="checkbox"
            checked={notes}
            disabled={action.pending || mode === "none"}
            onChange={(event) => {
              setNotes(event.target.checked);
              setSaved(false);
            }}
          />
          <span>Include workout notes with shared workouts</span>
        </label>
        <p className="field-hint">
          Nutrition, body measurements, photos, recovery entries and sign-in
          email are never shared here.
        </p>
        <ErrorMessage message={action.error} />
        {saved && (
          <p className="success-message" role="status">
            Sharing preferences saved.
          </p>
        )}
        <button className="button primary" disabled={action.pending}>
          {action.pending ? "Saving…" : "Save sharing preferences"}
        </button>
      </form>
    </details>
  );
}
