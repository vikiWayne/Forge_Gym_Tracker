import { useState, type FormEvent } from "react";
import type { Routine } from "../../shared/api/types";
import { api } from "../../shared/api/client";
import { localDate } from "../../shared/lib/dates";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import type { ScheduledWorkout } from "./types";

export function ScheduleForm({
  entry,
  routines,
  onSaved,
}: {
  entry?: ScheduledWorkout;
  routines: Routine[];
  onSaved: () => Promise<void>;
}) {
  const action = useAsyncAction();
  const [routine, setRoutine] = useState(
    entry?.routine_id || routines[0]?.id || "",
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void action.run(async () => {
      await api(
        `/schedule${entry ? `/${entry.id}` : ""}`,
        entry ? "PUT" : "POST",
        {
          routine_id: routine,
          date: data.get("date"),
          notes: data.get("notes"),
        },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <label>
        Routine
        <select
          required
          value={routine}
          onChange={(event) => setRoutine(event.target.value)}
        >
          {!routines.some((item) => item.id === routine) && (
            <option value="">Choose a routine</option>
          )}
          {routines.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Planned date
        <input
          name="date"
          type="date"
          defaultValue={entry?.date || localDate()}
          required
        />
      </label>
      <label>
        Notes <span className="optional">optional</span>
        <textarea
          name="notes"
          maxLength={1000}
          defaultValue={entry?.notes}
          placeholder="When or where will you train?"
        />
      </label>
      <p className="field-hint">
        Planning a workout does not create journal entries. Link a completed
        session or saved workout afterward.
      </p>
      <ErrorMessage message={action.error} />
      <button className="button primary full-width" disabled={action.pending}>
        {action.pending ? "Saving…" : "Save planned workout"}
      </button>
    </form>
  );
}
