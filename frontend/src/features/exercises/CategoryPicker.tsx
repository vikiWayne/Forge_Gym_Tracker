import { useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { CategoryForm } from "./CategoryForm";
export function CategoryPicker({
  value,
  onChange,
  onCreating,
}: {
  value: string;
  onChange: (id: string) => void;
  onCreating: (creating: boolean) => void;
}) {
  const { categories } = useTraining();
  const [creating, setCreating] = useState(false);
  function toggle(next: boolean) {
    setCreating(next);
    onCreating(next);
  }
  if (creating)
    return (
      <section className="inline-category">
        <button
          className="back-link"
          type="button"
          onClick={() => toggle(false)}
        >
          <ArrowLeft size={15} />
          Back to exercise
        </button>
        <CategoryForm
          embedded
          onSaved={(category) => {
            onChange(category.id);
            toggle(false);
          }}
        />
      </section>
    );
  return (
    <div className="category-picker">
      <label>
        Training category
        <select
          name="category_id"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <button className="text-link" type="button" onClick={() => toggle(true)}>
        <Plus size={15} />
        New category
      </button>
      {!categories.length && (
        <p className="field-hint">
          Create your first category to organize your movements.
        </p>
      )}
    </div>
  );
}
