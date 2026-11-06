import { useEffect, useState } from "react";
import { Flame, Sparkles, Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { localDate } from "../../shared/lib/dates";
import { workoutStreak } from "./streak";

export function StreakCard() {
  const { logs } = useTraining();
  const [today, setToday] = useState(localDate());
  const [celebration, setCelebration] = useState(0);
  useEffect(() => {
    const timer = window.setInterval(() => setToday(localDate()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  const streak = workoutStreak(
    logs.map((log) => log.date),
    today,
  );
  const end = Date.parse(today + "T00:00:00Z") / 86400000;
  const next =
    [3, 7, 14, 30, 60, 100].find((goal) => goal > streak.current) ??
    (Math.floor(streak.current / 100) + 1) * 100;
  return (
    <section className="panel streak-card" aria-labelledby="streak-heading">
      <div
        className="streak-flame"
        key={`${today}-${streak.current}-${celebration}`}
        aria-hidden="true"
      >
        <Flame size={52} />
        {streak.loggedToday && <span className="streak-sparks">✦ ✧ ✦</span>}
      </div>
      <div className="streak-copy">
        <span className="section-kicker">SMALL WINS. STRONGER HABITS.</span>
        <h2 id="streak-heading">{streak.current} day workout streak</h2>
        <p>
          {streak.loggedToday
            ? "Today is in the books. Enjoy your win!"
            : streak.current
              ? "Your streak is still alive today. Train when you’re ready."
              : "Your next chapter starts with one logged workout."}
        </p>
        <p className="streak-rule">
          One or more workouts per day counts once. Consecutive days build your
          streak. Rest when you need to.
        </p>
        <div
          className="streak-week"
          aria-label="Workout activity over the last seven days"
        >
          {Array.from({ length: 7 }, (_, i) => {
            const day = end - 6 + i;
            const date = new Date(day * 86400000);
            const hit = streak.days.has(day);
            return (
              <span
                className={hit ? "streak-hit" : ""}
                key={day}
                aria-label={`${date.toLocaleDateString(undefined, { timeZone: "UTC" })}: ${hit ? "workout logged" : "no workout"}`}
              >
                <span>
                  {date.toLocaleDateString(undefined, {
                    weekday: "short",
                    timeZone: "UTC",
                  })}
                </span>
                <strong aria-hidden="true">{hit ? "✓" : "·"}</strong>
              </span>
            );
          })}
        </div>
      </div>
      <div className="streak-goals">
        <span>
          <Trophy size={18} /> Best: {streak.best}{" "}
          {streak.best === 1 ? "day" : "days"}
        </span>
        <label htmlFor="streak-progress">Next milestone: {next} days</label>
        <progress id="streak-progress" max={next} value={streak.current} />
        {streak.loggedToday && (
          <button
            className="button secondary"
            onClick={() => setCelebration((value) => value + 1)}
          >
            <Sparkles size={17} />
            Celebrate
          </button>
        )}
        <Link className="text-link" to="/calendar">
          View your calendar →
        </Link>
      </div>
    </section>
  );
}
