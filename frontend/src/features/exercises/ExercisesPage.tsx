import { CategoryActions } from "./CategoryActions";
import { useState } from "react";
import { FolderPlus, Library, Plus } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseForm } from "./ExerciseForm";
import { CategoryForm } from "./CategoryForm";
import { ExerciseCatalog } from "../starter/ExerciseCatalog";
export function ExercisesPage() {
  const { categories, exercises, logs } = useTraining();
  const [dialog, setDialog] = useState<"exercise" | "category" | null>(null);
  const [browsing, setBrowsing] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const groups = categories
    .filter((category) => !selected || category.id === selected)
    .map((category) => ({
      ...category,
      exercises: exercises.filter(
        (exercise) =>
          exercise.category_id === category.id &&
          exercise.name.toLowerCase().includes(search.toLowerCase()),
      ),
    }));
  return (
    <>
      <PageHeader
        eyebrow="YOUR MOVEMENT LIBRARY"
        title="Your exercise library."
        description="Build your collection. Keep your next movement close."
        action={
          <div className="page-actions">
            <button
              className="button secondary"
              onClick={() => setBrowsing(true)}
            >
              <Library size={17} aria-hidden="true" /> Browse exercises
            </button>
            <button
              className="button secondary"
              onClick={() => setDialog("category")}
            >
              <FolderPlus size={17} />
              Add category
            </button>
            <button
              className="button primary"
              onClick={() => setDialog("exercise")}
            >
              <Plus size={17} />
              Add exercise
            </button>
          </div>
        }
      />
      <div className="list-toolbar">
        <label className="inline-label">
          Category
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option value={category.id} key={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <input
          aria-label="Find an exercise"
          placeholder="Find a movement…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      {groups.length ? (
        groups.map((category) => (
          <section className="category-group" key={category.id}>
            <div className="category-heading">
              <h2>
                {category.name}
                <span className="count-tag">{category.exercises.length}</span>
              </h2>
              <CategoryActions
                category={category}
                onDeleted={() => setSelected("")}
              />
            </div>
            {category.exercises.length ? (
              <div className="exercise-grid">
                {category.exercises.map((exercise, index) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    index={index}
                    latest={logs.find((log) => log.exercise_id === exercise.id)}
                  />
                ))}
              </div>
            ) : (
              <p className="category-empty">
                {search
                  ? "No matching movements in this category."
                  : "No exercises here yet. Add your first movement using Add exercise."}
              </p>
            )}
          </section>
        ))
      ) : (
        <EmptyState title="Give your training split a home.">
          Create a category such as Push, Pull or Legs, then add your exercises.
        </EmptyState>
      )}
      {browsing && <ExerciseCatalog close={() => setBrowsing(false)} />}
      {dialog && (
        <Modal
          title={
            dialog === "category"
              ? "Name your next training day"
              : "Make room for a new movement"
          }
          close={() => setDialog(null)}
        >
          {dialog === "category" ? (
            <CategoryForm onSaved={() => setDialog(null)} />
          ) : (
            <ExerciseForm onSaved={() => setDialog(null)} />
          )}
        </Modal>
      )}
    </>
  );
}
