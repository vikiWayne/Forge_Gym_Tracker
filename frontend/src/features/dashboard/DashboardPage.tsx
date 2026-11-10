import { useState } from "react";
import { ArrowUpRight, CalendarDays, Dumbbell, Target } from "lucide-react";
import { Link } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { formatDate } from "../../shared/lib/dates";
import { ExerciseChart } from "../progress/ExerciseChart";
import { StatsGrid } from "./StatsGrid";
import { JourneyCard, Milestones } from "./JourneyCard";
import { DailyQuests } from "./DailyQuests";
import { StreakCard } from "../streak/StreakCard";
export function DashboardPage() {
  const { logs, exercises } = useTraining();
  const [selected, setSelected] = useState("");
  const saved = logs.filter((log) => !log.pending_sync);
  const exercise =
    exercises.find((item) => item.id === selected) ||
    exercises.find((item) => saved.some((log) => log.exercise_id === item.id));
  return (
    <>
      <PageHeader
        eyebrow={new Date()
          .toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })
          .toUpperCase()}
        title="A little progress, every day."
        description="Your pace. Your progress. One small win at a time."
      />
      <JourneyCard />
      <DailyQuests />
      <nav className="today-shortcuts" aria-label="Plan your week">
        <Link to="/goals">
          <Target size={17} />
          Weekly goal
          <ArrowUpRight size={15} />
        </Link>
        <Link to="/schedule">
          <CalendarDays size={17} />
          Schedule
          <ArrowUpRight size={15} />
        </Link>
        <Link to="/calendar">
          <CalendarDays size={17} />
          Calendar
          <ArrowUpRight size={15} />
        </Link>
      </nav>
      {saved.length > 0 && <StatsGrid logs={saved} exercises={exercises} />}
      <Milestones />
      {exercise && (
        <section className="panel today-chart">
          <div className="section-head">
            <div>
              <span className="section-kicker">PROOF OF YOUR EFFORT</span>
              <h2>Your strength story</h2>
            </div>
            <select
              aria-label="Exercise to chart"
              value={exercise.id}
              onChange={(event) => setSelected(event.target.value)}
            >
              {exercises.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <ExerciseChart
            id={"overview-" + exercise.id}
            logs={saved.filter((log) => log.exercise_id === exercise.id)}
          />
        </section>
      )}
      {logs.length > 0 && (
        <section className="panel recent-workouts">
          <div className="section-head">
            <h2>Recently logged</h2>
            <Link className="text-link" to="/workouts">
              Journal
              <ArrowUpRight size={15} />
            </Link>
          </div>
          {logs.slice(0, 3).map((log) => (
            <Link
              className="recent-workout-row"
              key={log.id}
              to={
                log.pending_sync ? "/workouts" : "/workouts/" + log.id + "/edit"
              }
            >
              <span className="recent-workout-icon">
                <Dumbbell size={19} />
              </span>
              <div>
                <strong>
                  {exercises.find((item) => item.id === log.exercise_id)
                    ?.name || "Workout"}
                </strong>
                <span>
                  {log.pending_sync ? "Waiting to sync" : formatDate(log.date)}{" "}
                  · {log.sets.length} {log.sets.length === 1 ? "set" : "sets"}
                </span>
              </div>
              <b>
                {log.weight} <small>kg</small>
              </b>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </section>
      )}
      <details className="streak-details">
        <summary>
          Your training rhythm<span>View streak & week</span>
        </summary>
        <StreakCard />
      </details>
    </>
  );
}
