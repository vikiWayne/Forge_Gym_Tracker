import { Activity, Dumbbell, Flame, Zap } from "lucide-react";
import type { Exercise, Log } from "../../shared/api/types";
export function StatsGrid({
  logs,
  exercises,
}: {
  logs: Log[];
  exercises: Exercise[];
}) {
  const volume = logs.reduce(
    (total, log) =>
      total + log.sets.reduce((sum, set) => sum + set.weight * set.reps, 0),
    0,
  );
  const stats = [
    {
      label: "Workouts logged",
      value: logs.length,
      unit: logs.length === 1 ? "workout" : "workouts",
      note: "Every session is a win",
      icon: Dumbbell,
      tone: "teal",
    },
    {
      label: "Total volume",
      value: volume.toLocaleString(undefined, { maximumFractionDigits: 1 }),
      unit: "kg",
      note: "Your effort, adding up",
      icon: Activity,
      tone: "peach",
    },
    {
      label: "Training days",
      value: new Set(logs.map((log) => log.date)).size,
      unit: new Set(logs.map((log) => log.date)).size === 1 ? "day" : "days",
      note: "Building your own rhythm",
      icon: Flame,
      tone: "mint",
    },
    {
      label: "Ready to level up",
      value: exercises.filter((exercise) => exercise.ready).length,
      unit:
        exercises.filter((exercise) => exercise.ready).length === 1
          ? "exercise"
          : "exercises",
      note: "A little more in the tank",
      icon: Zap,
      tone: "pink",
    },
  ];
  return (
    <section className="stats-grid" aria-label="Your training statistics">
      {stats.map(({ label, value, unit, note, icon: Icon, tone }) => (
        <article className={`stat-card stat-${tone}`} key={label}>
          <div className="stat-top">
            <span>{label}</span>
            <span className="stat-icon">
              <Icon size={18} />
            </span>
          </div>
          <div className="stat-value">
            {value}
            <span>{unit}</span>
          </div>
          <p>{note}</p>
        </article>
      ))}
    </section>
  );
}
