import { useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { Routine } from "../../shared/api/types";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { SetEditor, type SetDraft } from "../workouts/SetEditor";

type Draft = { key: string; exercise_id: string; sets: SetDraft[] };
export function RoutineForm({
  routine,
  onSaved,
}: {
  routine?: Routine;
  onSaved: () => Promise<void>;
}) {
  const { exercises } = useTraining();
  const action = useAsyncAction();
  const make = (): Draft => ({
    key: crypto.randomUUID(),
    exercise_id: exercises[0]?.id || "",
    sets: [{ key: crypto.randomUUID(), weight: "0", reps: "8" }],
  });
  const [items, setItems] = useState<Draft[]>(
    () =>
      routine?.exercises.map((item) => ({
        ...item,
        key: crypto.randomUUID(),
        sets: item.sets.map((set) => ({
          key: crypto.randomUUID(),
          weight: String(set.weight),
          reps: String(set.reps),
        })),
      })) || [make()],
  );
  function move(index: number, shift: number) {
    const next = [...items];
    [next[index], next[index + shift]] = [next[index + shift], next[index]];
    setItems(next);
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fields = new FormData(event.currentTarget);
    void action.run(async () => {
      await api(
        `/routines${routine ? `/${routine.id}` : ""}`,
        routine ? "PUT" : "POST",
        {
          name: fields.get("name"),
          notes: fields.get("notes"),
          exercises: items.map((item) => ({
            exercise_id: item.exercise_id,
            sets: item.sets.map((set) => ({
              weight: Number(set.weight),
              reps: Number(set.reps),
            })),
          })),
        },
      );
      await onSaved();
    });
  }
  return (
    <form onSubmit={submit}>
      <label>
        Routine name
        <input
          name="name"
          required
          maxLength={80}
          defaultValue={routine?.name}
          placeholder="Push day, full body…"
        />
      </label>
      <p className="field-hint">
        Set your target weights and reps. Adjust actual results during your
        workout.
      </p>
      {items.map((item, index) => (
        <section className="routine-exercise" key={item.key}>
          <div className="section-head">
            <h3>Movement {index + 1}</h3>
            <div className="row-actions">
              <button
                type="button"
                className="icon-button"
                aria-label={`Move movement ${index + 1} up`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Move movement ${index + 1} down`}
                disabled={index === items.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown size={16} />
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove movement ${index + 1}`}
                disabled={items.length === 1}
                onClick={() =>
                  setItems(items.filter((row) => row.key !== item.key))
                }
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          <label>
            Exercise
            <select
              required
              value={item.exercise_id}
              onChange={(event) =>
                setItems(
                  items.map((row) =>
                    row.key === item.key
                      ? { ...row, exercise_id: event.target.value }
                      : row,
                  ),
                )
              }
            >
              {!exercises.some(
                (exercise) => exercise.id === item.exercise_id,
              ) && (
                <option value="">
                  Choose a replacement for deleted exercise
                </option>
              )}
              {exercises.map((exercise) => (
                <option value={exercise.id} key={exercise.id}>
                  {exercise.name} · {exercise.category}
                </option>
              ))}
            </select>
          </label>
          <SetEditor
            sets={item.sets}
            onChange={(sets) =>
              setItems(
                items.map((row) =>
                  row.key === item.key ? { ...row, sets } : row,
                ),
              )
            }
          />
        </section>
      ))}
      <button
        type="button"
        className="button secondary"
        disabled={items.length >= 20}
        onClick={() => setItems([...items, make()])}
      >
        <Plus size={16} />
        Add movement
      </button>
      <label>
        Routine notes
        <textarea name="notes" maxLength={1000} defaultValue={routine?.notes} />
      </label>
      <ErrorMessage message={action.error} />
      <button className="button primary full-width" disabled={action.pending}>
        {action.pending ? "Saving…" : "Save routine"}
      </button>
    </form>
  );
}
