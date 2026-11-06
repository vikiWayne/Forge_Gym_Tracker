import type { Exercise } from "../../shared/api/types";
import { CategoryPicker } from "./CategoryPicker";
import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "../../shared/api/client";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
export function ExerciseForm({
  onSaved,
  exercise,
}: {
  onSaved: () => void;
  exercise?: Exercise;
}) {
  const { refresh, categories } = useTraining();
  const [categoryId, setCategoryId] = useState(
    exercise?.category_id || categories[0]?.id || "",
  );
  const [creatingCategory, setCreatingCategory] = useState(false);
  const { pending, error, run } = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creatingCategory) return;
    const fields = new FormData(event.currentTarget);
    void run(async () => {
      await api(
        exercise ? `/exercises/${exercise.id}` : "/exercises",
        exercise ? "PUT" : "POST",
        {
          name: fields.get("name"),
          category_id: categoryId,
          notes: fields.get("notes"),
          rep_min: Number(fields.get("rep_min")),
          rep_max: Number(fields.get("rep_max")),
        },
      );
      await refresh();
      onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <ErrorMessage message={error} />
      <label>
        Exercise name
        <input
          name="name"
          defaultValue={exercise?.name}
          maxLength={80}
          placeholder="Name your movement"
          required
        />
      </label>
      <CategoryPicker
        value={categoryId}
        onChange={setCategoryId}
        onCreating={setCreatingCategory}
      />
      <div className="form-row">
        <label>
          Minimum reps
          <input
            name="rep_min"
            type="number"
            min={1}
            max={1000}
            defaultValue={exercise?.rep_min ?? 8}
            required
          />
        </label>
        <label>
          Maximum reps
          <input
            name="rep_max"
            type="number"
            min={1}
            max={1000}
            defaultValue={exercise?.rep_max ?? 12}
            required
          />
        </label>
      </div>
      <label>
        Notes <span className="optional">optional</span>
        <textarea
          name="notes"
          defaultValue={exercise?.notes}
          maxLength={1000}
          placeholder="Form cues, goals, little reminders…"
        />
      </label>
      <button
        className="button primary full-width"
        disabled={pending || creatingCategory || !categoryId}
      >
        <Plus size={17} />
        {pending ? "Saving…" : exercise ? "Save exercise" : "Add exercise"}
      </button>
    </form>
  );
}
