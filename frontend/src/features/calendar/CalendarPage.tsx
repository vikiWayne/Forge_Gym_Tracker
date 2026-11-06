import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useTracker } from "../tracking/useTracker";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { localDate } from "../../shared/lib/dates";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { groupActivity, monthDates, parseLocalDate } from "./calendarData";
import { CalendarGrid } from "./CalendarGrid";
import { CalendarDayDetails } from "./CalendarDayDetails";
export function CalendarPage() {
  const { logs, exercises, refresh } = useTraining();
  const protein = useTracker("protein");
  const weight = useTracker("body-weight");
  const action = useAsyncAction();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState(localDate());
  const activity = useMemo(
    () => groupActivity(logs, protein.entries, weight.entries),
    [logs, protein.entries, weight.entries],
  );
  const prefix = localDate(
    new Date(month.getFullYear(), month.getMonth(), 1),
  ).slice(0, 7);
  const gymDays = Object.entries(activity).filter(
    ([date, day]) => date.startsWith(prefix) && day.workouts.length,
  ).length;
  const { count } = monthDates(month);
  const today = localDate();
  const elapsed = Array.from({ length: count }, (_, index) =>
    localDate(new Date(month.getFullYear(), month.getMonth(), index + 1)),
  ).filter((date) => date <= today);
  const withoutLog = elapsed.filter(
    (date) => !activity[date]?.workouts.length,
  ).length;
  function select(date: string) {
    if (date > today) return;
    setSelected(date);
    setMonth(parseLocalDate(date));
  }
  function move(shift: number) {
    const next = new Date(month.getFullYear(), month.getMonth() + shift, 1);
    if (localDate(next) > today) return;
    setMonth(next);
    setSelected(localDate(next));
  }
  return (
    <>
      <PageHeader
        eyebrow="CONSISTENCY, ONE DAY AT A TIME"
        title="Your training calendar."
        description="Gym days are based on saved workouts. Choose a date to see its workouts, protein entries and body-weight logs."
        action={
          <button
            className="button secondary"
            disabled={action.pending}
            onClick={() =>
              void action.run(async () => {
                await Promise.all([
                  refresh(),
                  protein.refresh(),
                  weight.refresh(),
                ]);
              })
            }
          >
            <RefreshCw size={16} />
            Refresh calendar
          </button>
        }
      />
      <div className="calendar-summary">
        <span>
          <strong>{gymDays}</strong> gym days this month
        </span>
        <span>
          <strong>{withoutLog}</strong> elapsed days without a workout log
        </span>
      </div>
      <ErrorMessage message={protein.error || weight.error || action.error} />
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <h2 aria-live="polite">
            {month.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="row-actions">
            <button
              className="button secondary"
              onClick={() => select(localDate())}
            >
              Today
            </button>
            <button
              className="icon-button"
              aria-label="Previous month"
              onClick={() => move(-1)}
            >
              <ChevronLeft size={21} />
            </button>
            <button
              className="icon-button"
              aria-label="Next month"
              disabled={prefix >= today.slice(0, 7)}
              onClick={() => move(1)}
            >
              <ChevronRight size={21} />
            </button>
          </div>
        </div>
        <div className="calendar-legend">
          <span>
            <i className="gym-marker" />
            Workout logged
          </span>
          <span>
            <i className="no-log-marker" />
            No workout logged
          </span>
          <span>
            <i className="protein-marker" />
            Protein logged
          </span>
        </div>
        {protein.loading || weight.loading ? (
          <LoadingState />
        ) : (
          <CalendarGrid
            month={month}
            selected={selected}
            activity={activity}
            onSelect={select}
          />
        )}
        <p className="calendar-footnote">
          A day without a saved workout is marked “No log”; future days are
          disabled. Rest days count as days without a workout log.
        </p>
      </section>
      <CalendarDayDetails
        date={selected}
        day={activity[selected]}
        exercises={exercises}
      />
    </>
  );
}
