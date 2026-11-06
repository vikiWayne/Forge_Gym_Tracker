import { Link } from "react-router-dom";
import { Dumbbell, Utensils, Scale } from "lucide-react";
import type { Exercise } from "../../shared/api/types";
import { formatDate } from "../../shared/lib/dates";
import { SetSummary } from "../workouts/SetSummary";
import type { DayActivity } from "./calendarData";
export function CalendarDayDetails({
  date,
  day,
  exercises,
}: {
  date: string;
  day?: DayActivity;
  exercises: Exercise[];
}) {
  return (
    <section
      className="panel calendar-details"
      aria-labelledby="calendar-details-heading"
    >
      <div className="section-head">
        <div>
          <span className="section-kicker">YOUR SELECTED DAY</span>
          <h2 id="calendar-details-heading">{formatDate(date)}</h2>
        </div>
        <span
          className={`calendar-day-tag ${day?.workouts.length ? "tag-gym" : "tag-no-log"}`}
        >
          {day?.workouts.length ? "Gym day" : "No workout logged"}
        </span>
      </div>
      <div className="calendar-details-columns">
        <section>
          <h3>
            <Dumbbell size={19} />
            Workouts{" "}
            <span className="count-tag">{day?.workouts.length || 0}</span>
          </h3>
          {day?.workouts.length ? (
            day.workouts.map((log) => {
              const exercise = exercises.find(
                (item) => item.id === log.exercise_id,
              );
              return (
                <article className="calendar-workout" key={log.id}>
                  <div>
                    <h4>{exercise?.name || "Exercise"}</h4>
                    <span>{exercise?.category}</span>
                  </div>
                  <SetSummary sets={log.sets} />
                  {log.notes && <p>{log.notes}</p>}
                </article>
              );
            })
          ) : (
            <p className="calendar-detail-empty">
              No workouts were logged for this date.
            </p>
          )}
          <Link className="text-link" to="/workouts">
            Open workout journal
          </Link>
        </section>
        <section>
          <h3>
            <Utensils size={19} />
            Protein{" "}
            <span className="count-tag">
              {(day?.proteinTotal || 0).toFixed(2)} g
            </span>
          </h3>
          {day?.protein.length ? (
            day.protein.map((entry) => (
              <article className="calendar-protein-entry" key={entry.id}>
                <div>
                  <strong>{entry.label || "Protein entry"}</strong>
                  <span>{entry.value.toFixed(2)} g</span>
                </div>
                {entry.notes && <p>{entry.notes}</p>}
              </article>
            ))
          ) : (
            <p className="calendar-detail-empty">
              No protein entries were logged for this date.
            </p>
          )}
          <Link className="text-link" to="/protein">
            Open protein journal
          </Link>
        </section>
        <section>
          <h3>
            <Scale size={19} /> Body weight
          </h3>
          {day?.weight.length ? (
            day.weight.map((entry) => (
              <article className="calendar-protein-entry" key={entry.id}>
                <strong>{entry.value.toFixed(2)} kg</strong>
                {entry.notes && <p>{entry.notes}</p>}
              </article>
            ))
          ) : (
            <p className="calendar-detail-empty">
              No body-weight entries were logged for this date.
            </p>
          )}
          <Link className="text-link" to="/body-weight">
            Open body-weight journal
          </Link>
        </section>
      </div>
    </section>
  );
}
