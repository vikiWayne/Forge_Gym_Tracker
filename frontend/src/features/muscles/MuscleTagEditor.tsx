import { useState, type FormEvent } from "react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import type { MuscleData, MuscleExercise } from "./types";
export function MuscleTagEditor({
  exercise,
  groups,
  onSaved,
}: {
  exercise: MuscleExercise;
  groups: string[];
  onSaved: (data: MuscleData) => void;
}) {
  const [selected, setSelected] = useState(exercise.muscles);
  const [saved, setSaved] = useState(false);
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action.run(async () => {
      onSaved(
        await api<MuscleData>(`/muscles/exercises/${exercise.id}`, "PUT", {
          muscles: selected,
        }),
      );
      setSaved(true);
    });
  }
  return (
    <form onSubmit={submit}>
      <fieldset className="muscle-tag-options" disabled={action.pending}>
        <legend>Muscles trained by {exercise.name}</legend>
        {groups.map((group) => (
          <label
            key={group}
            className={
              selected.includes(group) ? "muscle-tag selected" : "muscle-tag"
            }
          >
            <input
              type="checkbox"
              checked={selected.includes(group)}
              onChange={(event) => {
                setSaved(false);
                setSelected(
                  event.target.checked
                    ? [...selected, group]
                    : selected.filter((value) => value !== group),
                );
              }}
            />
            {group}
          </label>
        ))}
      </fieldset>
      <p className="field-hint">
        Tag every muscle you want to track. Leaving all unchecked removes this
        exercise’s tags.
      </p>
      <ErrorMessage message={action.error} />
      {saved && (
        <p className="success-message" role="status">
          Muscle tags saved.
        </p>
      )}
      <button className="button primary" disabled={action.pending}>
        {action.pending ? "Saving…" : "Save muscle tags"}
      </button>
    </form>
  );
}
