import { type FormEvent } from "react";
import { Check } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAuth } from "../../app/providers/AuthProvider";
import type { User } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { trackerConfig, type TrackerEntry, type TrackerKind } from "./types";
export function TrackerForm({
  kind,
  entry,
  onSaved,
}: {
  kind: TrackerKind;
  entry?: TrackerEntry;
  onSaved: () => Promise<void>;
}) {
  const { pending, error, run } = useAsyncAction();
  const { authenticate } = useAuth();
  const config = trackerConfig[kind];
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    void run(async () => {
      await api(
        `/${kind}${entry ? `/${entry.id}` : ""}`,
        entry ? "PUT" : "POST",
        {
          value: Number(data.get("value")),
          date: data.get("date"),
          label: data.get("label") || "",
          notes: data.get("notes"),
        },
      );
      if (kind === "body-weight") authenticate(await api<User>("/me"));
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <ErrorMessage message={error} />
      <label>
        {config.label}
        <input
          name="value"
          type="number"
          min="0.01"
          max={kind === "protein" ? 10000 : 500}
          step="0.01"
          inputMode="decimal"
          placeholder={
            kind === "protein" ? "Protein in grams" : "Your weight in kilograms"
          }
          defaultValue={entry?.value}
          required
        />
      </label>
      <p className="field-hint">Up to 2 decimal places.</p>
      <label>
        Date
        <input
          name="date"
          type="date"
          max={localDate()}
          defaultValue={entry?.date || localDate()}
          required
        />
      </label>
      {kind === "protein" && (
        <label>
          Meal or source <span className="optional">optional</span>
          <input
            name="label"
            maxLength={100}
            defaultValue={entry?.label}
            placeholder="What are you logging?"
          />
        </label>
      )}
      <label>
        Notes <span className="optional">optional</span>
        <textarea
          name="notes"
          defaultValue={entry?.notes}
          maxLength={1000}
          placeholder={
            kind === "protein"
              ? "Anything you’d like to remember?"
              : "A little context for your weigh-in…"
          }
        />
      </label>
      <button className="button primary full-width" disabled={pending}>
        <Check size={17} />
        {pending ? "Saving…" : entry ? "Save changes" : config.action}
      </button>
    </form>
  );
}
