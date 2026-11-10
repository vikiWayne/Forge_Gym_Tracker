import { Link } from "react-router-dom";
import { ArrowUpRight, CheckCircle2, Minus, TrendingDown } from "lucide-react";
import type { Exercise, Log } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/dates";
import { suggestProgression } from "./progression";

export function ProgressionCard({
  exercise,
  logs,
  today,
  increment,
}: {
  exercise: Exercise;
  logs: Log[];
  today: string;
  increment: number;
}) {
  const suggestion = suggestProgression(exercise, logs, today, increment);
  const Icon =
    suggestion.kind === "increase"
      ? CheckCircle2
      : suggestion.kind === "reduce"
        ? TrendingDown
        : Minus;
  return (
    <article
      className={`panel progression-card progression-${suggestion.kind}`}
    >
      <div className="section-head">
        <div>
          <span className="section-kicker">{exercise.category}</span>
          <h2>{exercise.name}</h2>
        </div>
        <Icon size={23} aria-hidden="true" />
      </div>
      <p className="progression-range">
        Target: {exercise.rep_min ?? 8}–{exercise.rep_max ?? 12} reps ·{" "}
        {exercise.ready
          ? "You marked this exercise ready"
          : "Readiness not marked"}
      </p>
      <h3>{suggestion.title}</h3>
      <p>{suggestion.reason}</p>
      {suggestion.weight !== null && (
        <div className="progression-weight">
          <strong>
            {suggestion.weight.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}{" "}
            kg
          </strong>
          <span>
            {suggestion.kind === "increase" || suggestion.kind === "reduce"
              ? "weight to consider"
              : "latest heaviest weight"}
          </span>
        </div>
      )}
      {suggestion.evidence.length > 0 && (
        <details>
          <summary>Recent training evidence</summary>
          <ol className="progression-evidence">
            {suggestion.evidence.map((day) => (
              <li key={day.date}>
                <strong>{formatDate(day.date)}</strong>
                <ul>
                  {day.sets.map((set, index) => (
                    <li key={index}>
                      {set.weight} kg × {set.reps} reps
                      {set.rpe != null ? ` · RPE ${set.rpe}` : ""}
                      {set.rir != null ? ` · ${set.rir} RIR` : ""}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </details>
      )}
      <Link to={`/workouts/new?exercise=${exercise.id}`} className="text-link">
        Log this exercise
        <ArrowUpRight size={16} />
      </Link>
    </article>
  );
}
