import type { FormEvent } from "react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { recoveryRatings, type RecoveryEntry } from "./types";
export function RecoveryForm({
  entry,
  onSaved,
}: {
  entry?: RecoveryEntry;
  onSaved: () => Promise<void>;
}) {
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void action.run(async () => {
      await api(
        `/recovery${entry ? `/${entry.id}` : ""}`,
        entry ? "PUT" : "POST",
        {
          date: fields.get("date"),
          sleep_hours: Number(fields.get("sleep_hours")),
          energy: Number(fields.get("energy")),
          soreness: Number(fields.get("soreness")),
          mood: Number(fields.get("mood")),
          notes: fields.get("notes"),
        },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <div className="form-row">
        <label>
          Date
          <input
            name="date"
            type="date"
            required
            max={localDate()}
            defaultValue={entry?.date || localDate()}
          />
        </label>
        <label>
          Sleep (hours)
          <input
            name="sleep_hours"
            type="number"
            required
            min={0}
            max={24}
            step="0.01"
            defaultValue={entry?.sleep_hours}
            placeholder="Hours slept"
          />
        </label>
      </div>
      {Object.entries(recoveryRatings).map(([name, labels]) => (
        <label key={name}>
          {name === "energy"
            ? "Energy"
            : name === "soreness"
              ? "Soreness"
              : "Mood"}
          <select
            name={name}
            defaultValue={entry?.[name as keyof typeof recoveryRatings] ?? 3}
          >
            {labels.map((label, index) => (
              <option key={label} value={index + 1}>
                {index + 1} — {label}
              </option>
            ))}
          </select>
        </label>
      ))}
      <label>
        Notes <span className="optional">optional</span>
        <textarea
          name="notes"
          maxLength={1000}
          defaultValue={entry?.notes}
          placeholder="A little context for your day…"
        />
      </label>
      <p className="field-hint">
        One entry per date. Sleep and ratings are personal observations; these
        entries stay private.
      </p>
      <ErrorMessage message={action.error} />
      <button className="button primary full-width" disabled={action.pending}>
        {action.pending
          ? "Saving…"
          : entry
            ? "Save changes"
            : "Save recovery entry"}
      </button>
    </form>
  );
}
