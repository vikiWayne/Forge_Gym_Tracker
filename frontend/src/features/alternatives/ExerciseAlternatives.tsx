import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../shared/api/client";
import type { Alternative } from "./types";
import "./alternatives.css";
export function ExerciseAlternatives({ exerciseId }: { exerciseId: string }) {
  const [links, setLinks] = useState<Alternative[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    setLinks([]);
    void api<{ alternatives: Alternative[] }>(
      `/alternatives?exercise_id=${encodeURIComponent(exerciseId)}`,
      "GET",
      undefined,
      controller.signal,
    )
      .then((result) => setLinks(result.alternatives))
      .catch(() => {});
    return () => controller.abort();
  }, [exerciseId]);
  if (!links.length) return null;
  return (
    <aside className="exercise-alternatives">
      <strong>Need a different movement?</strong>
      <ul>
        {links.map((link) => {
          const otherId =
            link.exercise_a === exerciseId ? link.exercise_b : link.exercise_a;
          const name =
            link.exercise_a === exerciseId ? link.name_b : link.name_a;
          return (
            <li key={link.id}>
              <Link to={`/workouts/new?exercise=${otherId}`}>{name} →</Link>
              {link.note && <small>{link.note}</small>}
            </li>
          );
        })}
      </ul>
      <p className="field-hint">
        Opening another movement starts a separate log. Save your current draft
        first.
      </p>
    </aside>
  );
}
