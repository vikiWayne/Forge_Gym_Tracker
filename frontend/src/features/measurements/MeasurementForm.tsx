import type { FormEvent } from "react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { ErrorMessage } from "../../shared/ui/Feedback";
import {
  measurementLabels,
  type Measurement,
  type MeasurementType,
} from "./types";

export function MeasurementForm({
  entry,
  initialType,
  onSaved,
}: {
  entry?: Measurement;
  initialType: MeasurementType;
  onSaved: () => Promise<void>;
}) {
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void action.run(async () => {
      await api(
        `/measurements${entry ? `/${entry.id}` : ""}`,
        entry ? "PUT" : "POST",
        {
          type: fields.get("type"),
          value: Number(fields.get("value")),
          date: fields.get("date"),
          notes: fields.get("notes"),
        },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <label>
        Measurement
        <select name="type" defaultValue={entry?.type || initialType}>
          {Object.entries(measurementLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="form-row">
        <label>
          Size (cm)
          <input
            name="value"
            type="number"
            min="0.01"
            max="500"
            step="0.01"
            inputMode="decimal"
            required
            defaultValue={entry?.value}
          />
        </label>
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
      </div>
      <p className="field-hint">
        Use centimeters, with up to two decimal places. Add separate entries for
        any other areas you measure.
      </p>
      <label>
        Notes <span className="optional">optional</span>
        <textarea
          name="notes"
          maxLength={1000}
          defaultValue={entry?.notes}
          placeholder="Keep a little context for your measurement…"
        />
      </label>
      <ErrorMessage message={action.error} />
      <button className="button primary full-width" disabled={action.pending}>
        {action.pending
          ? "Saving…"
          : entry
            ? "Save measurement"
            : "Log measurement"}
      </button>
    </form>
  );
}
