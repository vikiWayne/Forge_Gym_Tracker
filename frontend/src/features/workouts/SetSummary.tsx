import type { WorkoutSet } from "../../shared/api/types";
export function SetSummary({ sets }: { sets: WorkoutSet[] }) {
  return (
    <ol className="set-breakdown" aria-label="Sets with weight and reps">
      {sets.map((set, index) => (
        <li key={index}>
          <span className="set-badge">{index + 1}</span>
          <strong>{set.weight} kg</strong>
          <span>× {set.reps} reps</span>
        </li>
      ))}
    </ol>
  );
}
