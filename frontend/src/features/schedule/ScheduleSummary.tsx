import type { ScheduledWorkout } from "./types";
export function ScheduleSummary({
  entries,
  today,
}: {
  entries: ScheduledWorkout[];
  today: string;
}) {
  return (
    <section
      className="schedule-summary"
      aria-label="Planned and completed workouts"
    >
      <div>
        <strong>{entries.length}</strong>
        <span>planned workouts</span>
      </div>
      <div>
        <strong>{entries.filter((entry) => entry.completed_at).length}</strong>
        <span>marked completed</span>
      </div>
      <div>
        <strong>
          {
            entries.filter(
              (entry) => !entry.completed_at && entry.date >= today,
            ).length
          }
        </strong>
        <span>upcoming plans</span>
      </div>
    </section>
  );
}
