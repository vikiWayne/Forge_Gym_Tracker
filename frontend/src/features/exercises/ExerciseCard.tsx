import { ExerciseActions } from "./ExerciseActions";
import { Dumbbell, ArrowUpRight, Zap } from "lucide-react";
import type { Exercise, Log } from "../../shared/api/types";
import { api } from "../../shared/api/client";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import { Link } from "react-router-dom";
export function ExerciseCard({
  exercise,
  latest,
  index,
}: {
  exercise: Exercise;
  latest?: Log;
  index: number;
}) {
  const { refresh, categories } = useTraining();
  const { pending, error, run } = useAsyncAction();
  return (
    <article
      className={`exercise-card tone-${index % 3} ${exercise.ready ? "exercise-ready" : ""}`}
    >
      <div className="exercise-card-top">
        <span className="exercise-icon">
          <Dumbbell size={24} />
        </span>
        <select
          className="exercise-category-select"
          aria-label={`Category for ${exercise.name}`}
          value={exercise.category_id}
          disabled={pending}
          onChange={(event) => {
            const category_id = event.target.value;
            void run(async () => {
              await api(`/exercises/${exercise.id}`, "PATCH", { category_id });
              await refresh();
            });
          }}
        >
          {categories.map((category) => (
            <option value={category.id} key={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      <h2>{exercise.name}</h2>
      {!!exercise.ready && (
        <div className="ready-indicator" role="status">
          <span />
          Ready for next weight
        </div>
      )}
      <p className="exercise-notes">{exercise.notes || "No notes added."}</p>
      <div className="rep-range">
        TARGET RANGE{" "}
        <strong>
          {exercise.rep_min ?? 8}–{exercise.rep_max ?? 12} reps
        </strong>
      </div>
      <div className="exercise-latest">
        <div>
          <strong>{latest ? latest.weight : "—"}</strong>
          <span> kg</span>
        </div>
        <div>
          <strong>{latest ? latest.reps : "—"}</strong>
          <span> reps</span>
        </div>
        <Link
          to={`/workouts/new?exercise=${exercise.id}`}
          aria-label={`Log ${exercise.name}`}
          className="icon-button"
        >
          <ArrowUpRight size={19} />
        </Link>
      </div>
      <p className="last-logged">
        {latest
          ? `${latest.sets.length} ${latest.sets.length === 1 ? "set" : "sets"} · best set · ${formatDate(latest.date)}`
          : "Your first session is waiting."}
      </p>
      <ExerciseActions exercise={exercise} />
      <div className="readiness">
        <span>
          <Zap size={15} />
          {exercise.ready
            ? "Next weight, here you come"
            : "Ready for the next weight?"}
        </span>
        <button
          type="button"
          className={`switch ${exercise.ready ? "on" : ""}`}
          role="switch"
          aria-checked={!!exercise.ready}
          aria-label={`Ready for next weight: ${exercise.name}`}
          disabled={pending}
          onClick={() =>
            void run(async () => {
              await api(`/exercises/${exercise.id}`, "PATCH", {
                ready: !exercise.ready,
              });
              await refresh();
            })
          }
        >
          <span />
        </button>
      </div>
      <ErrorMessage message={error} />
    </article>
  );
}
