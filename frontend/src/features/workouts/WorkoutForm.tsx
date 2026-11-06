import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { Log } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { SetEditor, type SetDraft } from "./SetEditor";
export function WorkoutForm({
  log,
  exerciseId,
}: {
  log?: Log;
  exerciseId?: string;
}) {
  const { exercises, categories, refresh } = useTraining();
  const navigate = useNavigate();
  const { pending, error, run } = useAsyncAction();
  const initial =
    exercises.find(
      (exercise) => exercise.id === (log?.exercise_id || exerciseId),
    ) || exercises[0];
  const [categoryId, setCategoryId] = useState(initial.category_id);
  const [selected, setSelected] = useState(initial.id);
  const [sets, setSets] = useState<SetDraft[]>(
    () =>
      log?.sets.map((set) => ({
        key: crypto.randomUUID(),
        weight: String(set.weight),
        reps: String(set.reps),
      })) || [{ key: crypto.randomUUID(), weight: "", reps: "" }],
  );
  const available = exercises.filter(
    (exercise) => exercise.category_id === categoryId,
  );
  function changeCategory(id: string) {
    setCategoryId(id);
    setSelected(
      exercises.find((exercise) => exercise.category_id === id)?.id || "",
    );
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      await api(`/logs${log ? `/${log.id}` : ""}`, log ? "PUT" : "POST", {
        exercise_id: selected,
        sets: sets.map((set) => ({
          weight: Number(set.weight),
          reps: Number(set.reps),
        })),
        date: fields.get("date"),
        notes: fields.get("notes"),
      });
      await refresh();
      navigate("/workouts");
    });
  }
  return (
    <form onSubmit={submit}>
      <ErrorMessage message={error} />
      <div className="form-row">
        <label>
          Training category
          <select
            value={categoryId}
            onChange={(event) => changeCategory(event.target.value)}
            required
          >
            {categories
              .filter((category) =>
                exercises.some(
                  (exercise) => exercise.category_id === category.id,
                ),
              )
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
          </select>
        </label>
        <label>
          Exercise
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            required
          >
            {available.map((exercise) => (
              <option key={exercise.id} value={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <SetEditor sets={sets} onChange={setSets} />
      <label>
        Workout date
        <input
          name="date"
          type="date"
          max={localDate()}
          defaultValue={log?.date || localDate()}
          required
        />
      </label>
      <label>
        Session notes <span className="optional">optional</span>
        <textarea
          name="notes"
          defaultValue={log?.notes}
          placeholder="How did you feel? Anything to remember?"
          maxLength={1000}
        />
      </label>
      <div className="form-actions">
        <Link to="/workouts" className="button secondary">
          Cancel
        </Link>
        <button className="button workout-cta" disabled={pending}>
          <Check size={17} />
          {pending ? "Saving…" : log ? "Save changes" : "Save workout"}
        </button>
      </div>
    </form>
  );
}
