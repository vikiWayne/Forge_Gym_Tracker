import { useState, type FormEvent } from "react";
import type { Exercise, Log } from "../../shared/api/types";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import {
  indiaSessionDate,
  type CompletedSession,
  type ScheduledWorkout,
} from "./types";

export function ScheduleCompletion({
  entry,
  sessions,
  logs,
  exercises,
  onSaved,
}: {
  entry: ScheduledWorkout;
  sessions: CompletedSession[];
  logs: Log[];
  exercises: Exercise[];
  onSaved: () => Promise<void>;
}) {
  const options = [
    ...sessions
      .filter((session) => indiaSessionDate(session.started_at) === entry.date)
      .map((session) => ({
        value: `session:${session.id}`,
        label: `${session.name} · completed session`,
      })),
    ...logs
      .filter((log) => log.date === entry.date)
      .map((log) => ({
        value: `log:${log.id}`,
        label: `${exercises.find((item) => item.id === log.exercise_id)?.name || "Exercise"} · ${log.sets.length} sets in journal`,
      })),
  ];
  const [selected, setSelected] = useState(options[0]?.value || "");
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const [kind, id] = selected.split(":");
    void action.run(async () => {
      await api(
        `/schedule/${entry.id}/completion`,
        "POST",
        kind === "session" ? { session_id: id } : { log_id: id },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <p>
        Choose the work that fulfilled “{entry.routine_name}”. Only saved
        workouts on its planned date are available.
      </p>
      {options.length ? (
        <label>
          Completed work
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            required
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="field-hint">
          No completed session or journal workout exists on this date yet. Log
          your workout first, then return here. This list includes your 20 most
          recent completed sessions and all journal workouts.
        </p>
      )}
      <ErrorMessage message={action.error} />
      <button
        className="button primary full-width"
        disabled={action.pending || !selected}
      >
        {action.pending ? "Saving…" : "Mark plan completed"}
      </button>
    </form>
  );
}
