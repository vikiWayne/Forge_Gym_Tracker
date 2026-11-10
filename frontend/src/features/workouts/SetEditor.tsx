import { Copy, Plus, Trash2 } from "lucide-react";
import { EffortFields } from "./EffortFields";
export type SetDraft = {
  key: string;
  weight: string;
  reps: string;
  rpe?: string;
  rir?: string;
};
export function SetEditor({
  sets,
  onChange,
  includeEffort = false,
}: {
  sets: SetDraft[];
  onChange: (sets: SetDraft[]) => void;
  includeEffort?: boolean;
}) {
  function update(
    key: string,
    field: "weight" | "reps" | "rpe" | "rir",
    value: string,
  ) {
    onChange(
      sets.map((set) => (set.key === key ? { ...set, [field]: value } : set)),
    );
  }
  function add(copy = false) {
    const previous = sets[sets.length - 1];
    onChange([
      ...sets,
      {
        key: crypto.randomUUID(),
        weight: copy ? previous.weight : "",
        reps: copy ? previous.reps : "",
        ...(includeEffort
          ? {
              rpe: copy ? previous.rpe || "" : "",
              rir: copy ? previous.rir || "" : "",
            }
          : {}),
      },
    ]);
  }
  return (
    <fieldset className="set-editor">
      <legend>Your sets</legend>
      <p className="field-hint">
        Different weights? Different reps? Log each set your way.
      </p>
      {includeEffort && (
        <p className="field-hint set-effort-note">
          RPE describes effort from 1–10 (half points allowed). Reps in reserve
          records how many more reps you felt you could do, from 0–10.
        </p>
      )}
      <div className="set-header" aria-hidden="true">
        <span>SET</span>
        <span>WEIGHT (kg)</span>
        <span>REPS</span>
        <span />
      </div>
      {sets.map((set, index) => (
        <div className="set-entry" key={set.key}>
          <div className="set-row">
            <span className="set-number">{index + 1}</span>
            <label className="set-field">
              <span className="sr-only">Set {index + 1} weight (kg)</span>
              <input
                name={`set-weight-${index}`}
                type="number"
                min={0}
                max={1500}
                step="0.01"
                placeholder="0"
                value={set.weight}
                onChange={(event) =>
                  update(set.key, "weight", event.target.value)
                }
                required
              />
            </label>
            <label className="set-field">
              <span className="sr-only">Set {index + 1} reps</span>
              <input
                name={`set-reps-${index}`}
                type="number"
                min={1}
                max={1000}
                step={1}
                placeholder="0"
                value={set.reps}
                onChange={(event) =>
                  update(set.key, "reps", event.target.value)
                }
                required
              />
            </label>
            <button
              className="icon-button"
              type="button"
              aria-label={`Remove set ${index + 1}`}
              disabled={sets.length === 1}
              onClick={() =>
                onChange(sets.filter((item) => item.key !== set.key))
              }
            >
              <Trash2 size={16} />
            </button>
          </div>
          {includeEffort && (
            <EffortFields
              label={`Set ${index + 1}`}
              rpe={set.rpe || ""}
              rir={set.rir || ""}
              onChange={(field, value) => update(set.key, field, value)}
            />
          )}
        </div>
      ))}
      <div className="set-actions">
        <button
          type="button"
          className="button secondary"
          disabled={sets.length >= 50}
          onClick={() => add()}
        >
          <Plus size={15} />
          Add set
        </button>
        <button
          type="button"
          className="button subtle"
          disabled={sets.length >= 50}
          onClick={() => add(true)}
        >
          <Copy size={15} />
          Repeat last set
        </button>
      </div>
      <p className="set-summary" role="status" key={sets.length}>
        {sets.length} set{sets.length === 1 ? "" : "s"} ·{" "}
        {sets.reduce((sum, set) => sum + Number(set.reps), 0)} reps ·{" "}
        {sets
          .reduce((sum, set) => sum + Number(set.weight) * Number(set.reps), 0)
          .toLocaleString()}{" "}
        kg volume
      </p>
    </fieldset>
  );
}
