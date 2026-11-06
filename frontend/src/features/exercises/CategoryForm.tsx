import { useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { api } from "../../shared/api/client";
import type { Category } from "../../shared/api/types";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
const suggestions = ["Push", "Pull", "Legs", "Upper", "Lower"];
export function CategoryForm({
  onSaved,
  embedded = false,
  category,
}: {
  onSaved: (category: Category) => void;
  embedded?: boolean;
  category?: Category;
}) {
  const [name, setName] = useState(category?.name || "");
  const { refresh } = useTraining();
  const { pending, error, run } = useAsyncAction();
  function save() {
    void run(async () => {
      const savedCategory = await api<Category>(
        category ? `/categories/${category.id}` : "/categories",
        category ? "PUT" : "POST",
        { name },
      );
      await refresh();
      onSaved(savedCategory);
    });
  }
  const body = (
    <>
      <p className="modal-description">
        Your split, your rules. Group movements into Push, Pull, Legs, or a
        category of your own.
      </p>
      <ErrorMessage message={error} />
      <label>
        Category name
        <input
          name="category_name"
          value={name}
          onKeyDown={(event) => {
            if (embedded && event.key === "Enter") {
              event.preventDefault();
              save();
            }
          }}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={50}
          placeholder="Give your training day a name"
        />
      </label>
      <div
        className="category-suggestions"
        aria-label="Category name suggestions"
      >
        {suggestions.map((suggestion) => (
          <button
            type="button"
            key={suggestion}
            className="button secondary"
            onClick={() => setName(suggestion)}
          >
            {suggestion}
          </button>
        ))}
      </div>
      <button
        type={embedded ? "button" : "submit"}
        onClick={embedded ? save : undefined}
        className="button primary full-width"
        disabled={pending}
      >
        <Plus size={17} />
        {pending ? "Saving…" : category ? "Save category" : "Create category"}
      </button>
    </>
  );
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    save();
  }
  return embedded ? <div>{body}</div> : <form onSubmit={submit}>{body}</form>;
}
