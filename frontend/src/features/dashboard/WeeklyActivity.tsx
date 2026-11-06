import { Check, Flower2 } from "lucide-react";
import type { Log } from "../../shared/api/types";
import { localDate } from "../../shared/lib/dates";
export function WeeklyActivity({ logs }: { logs: Log[] }) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - 6 + index);
    return { date, active: logs.some((log) => log.date === localDate(date)) };
  });
  return (
    <section className="panel weekly-panel">
      <div className="section-head">
        <div>
          <span className="section-kicker">THE LITTLE THINGS ADD UP</span>
          <h2>Your weekly rhythm</h2>
        </div>
        <Flower2 size={23} />
      </div>
      <div className="week-days">
        {days.map(({ date, active }) => (
          <div key={localDate(date)}>
            <span>
              {date.toLocaleDateString(undefined, { weekday: "narrow" })}
            </span>
            <div
              className={`week-day ${active ? "done" : ""}`}
              aria-label={`${date.toLocaleDateString()}: ${active ? "workout logged" : "no workout logged"}`}
            >
              {active ? <Check size={16} /> : date.getDate()}
            </div>
          </div>
        ))}
      </div>
      <div className="weekly-note">
        <h3>Make showing up your thing.</h3>
        <p>
          {days.filter((day) => day.active).length} active days in the last
          week. Rest days are part of the journey, too.
        </p>
      </div>
      <div className="weekly-bottom">
        <span className="status-dot" />
        PROGRESS AT YOUR OWN PACE
      </div>
    </section>
  );
}
