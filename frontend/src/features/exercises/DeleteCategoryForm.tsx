import { useState, type FormEvent } from "react";
import { api } from "../../shared/api/client";
import type { Category } from "../../shared/api/types";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
export function DeleteCategoryForm({
  category,
  onSaved,
  onCancel,
}: {
  category: Category;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const { categories, exercises, refresh } = useTraining();
  const count = exercises.filter(
    (exercise) => exercise.category_id === category.id,
  ).length;
  const destinations = categories.filter((item) => item.id !== category.id);
  const [target, setTarget] = useState(destinations[0]?.id || "");
  const { pending, error, run } = useAsyncAction();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await api(
        `/categories/${category.id}`,
        "DELETE",
        count ? { target_category_id: target } : {},
      );
      await refresh();
      onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <p className="modal-description">
        Delete “{category.name}”?{" "}
        {count
          ? `Move its ${count} exercise${count === 1 ? "" : "s"} to another category first. Your workout history will be kept.`
          : "This category is empty. Deleting it will not affect any workouts."}
      </p>
      {count > 0 &&
        (destinations.length ? (
          <label>
            Move exercises to
            <select
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              required
            >
              {destinations.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="field-hint">
            Create another category from the exercise library, then return here
            to move these exercises and delete this category.
          </p>
        ))}
      <ErrorMessage message={error} />
      <div className="form-actions">
        <button type="button" className="button secondary" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="button danger"
          disabled={pending || (count > 0 && !target)}
        >
          {pending
            ? "Deleting…"
            : count
              ? "Move & delete category"
              : "Delete category"}
        </button>
      </div>
    </form>
  );
}
