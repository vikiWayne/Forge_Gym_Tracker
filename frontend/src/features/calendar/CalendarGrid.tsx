import { useEffect, useRef } from "react";
import { Check, Minus, Utensils } from "lucide-react";
import { localDate, formatDate } from "../../shared/lib/dates";
import { monthDates, parseLocalDate, type DayActivity } from "./calendarData";
const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export function CalendarGrid({
  month,
  selected,
  activity,
  onSelect,
}: {
  month: Date;
  selected: string;
  activity: Record<string, DayActivity>;
  onSelect: (date: string) => void;
}) {
  const { count, offset } = monthDates(month);
  const today = localDate();
  const keyboard = useRef(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  useEffect(() => {
    if (keyboard.current) {
      buttons.current.get(selected)?.focus({ preventScroll: true });
      keyboard.current = false;
    }
  }, [selected]);
  const cells = Array.from(
    { length: Math.ceil((offset + count) / 7) * 7 },
    (_, index) => {
      const number = index - offset + 1;
      return number >= 1 && number <= count
        ? localDate(new Date(month.getFullYear(), month.getMonth(), number))
        : null;
    },
  );
  return (
    <div
      className="workout-calendar-grid"
      role="grid"
      aria-label="Workout activity calendar"
    >
      <div className="calendar-weekdays" role="row">
        {weekdays.map((day) => (
          <div role="columnheader" key={day}>
            {day}
          </div>
        ))}
      </div>
      {Array.from({ length: cells.length / 7 }, (_, week) => (
        <div className="calendar-week" role="row" key={week}>
          {cells.slice(week * 7, week * 7 + 7).map((date, index) => {
            if (!date)
              return (
                <div
                  role="gridcell"
                  className="calendar-blank"
                  key={`blank-${index}`}
                />
              );
            const day = activity[date];
            const hit = !!day?.workouts.length;
            const future = date > today;
            return (
              <div role="gridcell" aria-selected={selected === date} key={date}>
                <button
                  ref={(element) => {
                    if (element) buttons.current.set(date, element);
                    else buttons.current.delete(date);
                  }}
                  type="button"
                  disabled={future}
                  className={`calendar-day ${hit ? "gym-day" : future ? "future-day" : "no-gym-day"} ${selected === date ? "selected-day" : ""} ${date === today ? "calendar-today" : ""}`}
                  tabIndex={date === selected ? 0 : -1}
                  aria-label={`${formatDate(date)}, ${hit ? `${day.workouts.length} workout${day.workouts.length === 1 ? "" : "s"} logged` : future ? "upcoming" : "no workout logged"}${day?.protein.length ? `, ${day.proteinTotal.toFixed(2)} grams protein` : ""}`}
                  aria-current={date === today ? "date" : undefined}
                  onClick={() => onSelect(date)}
                  onKeyDown={(event) => {
                    const shifts: Record<string, number> = {
                      ArrowLeft: -1,
                      ArrowRight: 1,
                      ArrowUp: -7,
                      ArrowDown: 7,
                    };
                    let shift = shifts[event.key];
                    if (event.key === "Home")
                      shift = -((parseLocalDate(date).getDay() + 6) % 7);
                    if (event.key === "End")
                      shift = 6 - ((parseLocalDate(date).getDay() + 6) % 7);
                    if (shift === undefined) return;
                    event.preventDefault();
                    const next = parseLocalDate(date);
                    next.setDate(next.getDate() + shift);
                    if (localDate(next) > today) return;
                    keyboard.current = true;
                    onSelect(localDate(next));
                  }}
                >
                  <span className="calendar-date-number">
                    {parseLocalDate(date).getDate()}
                  </span>
                  <span className="calendar-gym-status">
                    {hit ? (
                      <Check size={15} />
                    ) : future ? (
                      <span className="upcoming-dot" />
                    ) : (
                      <Minus size={15} />
                    )}
                    <span>{hit ? "Gym" : future ? "Next" : "No log"}</span>
                  </span>
                  {!!day?.protein.length && (
                    <span className="calendar-protein-dot" aria-hidden="true">
                      <Utensils size={12} />
                      <span>{day.proteinTotal.toFixed(2)}g</span>
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
