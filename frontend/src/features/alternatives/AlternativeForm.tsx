import { useState, type FormEvent } from "react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import type { Alternative } from "./types";
export function AlternativeForm({
  link,
  onSaved,
}: {
  link?: Alternative;
  onSaved: () => Promise<void>;
}) {
  const { exercises } = useTraining();
  const [first, setFirst] = useState(exercises[0]?.id || "");
  const [second, setSecond] = useState(exercises[1]?.id || "");
  const action = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void action.run(async () => {
      await api(
        `/alternatives${link ? `/${link.id}` : ""}`,
        link ? "PATCH" : "POST",
        { exercise_a: first, exercise_b: second, note: fields.get("note") },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      {link ? (
        <p>
          {link.name_a} ↔ {link.name_b}
        </p>
      ) : (
        <>
          <label>
            Exercise
            <select
              required
              value={first}
              onChange={(event) => setFirst(event.target.value)}
            >
              {exercises.map((exercise) => (
                <option value={exercise.id} key={exercise.id}>
                  {exercise.name} · {exercise.category}
                </option>
              ))}
            </select>
          </label>
          <label>
            Alternative
            <select
              required
              value={second}
              onChange={(event) => setSecond(event.target.value)}
            >
              <option value="" disabled>
                Choose another movement
              </option>
              {exercises
                .filter((exercise) => exercise.id !== first)
                .map((exercise) => (
                  <option value={exercise.id} key={exercise.id}>
                    {exercise.name} · {exercise.category}
                  </option>
                ))}
            </select>
          </label>
          <p className="field-hint">
            The link works both ways. Your routines and active workouts stay as
            you set them.
          </p>
        </>
      )}
      <label>
        Equipment or substitution note{" "}
        <span className="optional">optional</span>
        <textarea
          name="note"
          maxLength={500}
          defaultValue={link?.note}
          placeholder="For example: use dumbbells when the bench is busy."
        />
      </label>
      <ErrorMessage message={action.error} />
      <button
        className="button primary full-width"
        disabled={
          action.pending || (!link && (!first || !second || first === second))
        }
      >
        {action.pending ? "Saving…" : link ? "Save note" : "Link exercises"}
      </button>
    </form>
  );
}
