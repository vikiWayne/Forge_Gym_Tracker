import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { ExerciseChart } from "./ExerciseChart";
import { PersonalRecords } from "./PersonalRecords";
import { Milestones } from "../dashboard/JourneyCard";
export function ProgressPage() {
  const { exercises, logs } = useTraining();
  const [range, setRange] = useState("90");
  const [selected, setSelected] = useState("");
  const exercise =
    exercises.find((item) => item.id === selected) || exercises[0];
  const saved = logs.filter(
    (log) => !log.pending_sync && log.exercise_id === exercise?.id,
  );
  const cutoff = Date.now() - Number(range) * 86400000;
  return (
    <>
      <PageHeader
        eyebrow="EVERY REP ADDS UP"
        title="Your effort, made visible."
        description="Personal bests, little milestones and the work that got you here."
      />
      <Milestones />
      {exercise ? (
        <>
          <section
            className="panel progress-controls"
            aria-label="Choose progress to review"
          >
            <label>
              Movement
              <select
                value={exercise.id}
                onChange={(event) => setSelected(event.target.value)}
              >
                {exercises.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.category}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Time range
              <select
                value={range}
                onChange={(event) => setRange(event.target.value)}
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="36500">All time</option>
              </select>
            </label>
          </section>
          <section className="panel">
            <div className="section-head">
              <div>
                <span className="section-kicker">{exercise.category}</span>
                <h2>{exercise.name}</h2>
              </div>
              <span className="panel-icon">
                <TrendingUp size={21} />
              </span>
            </div>
            <PersonalRecords logs={saved} />
            <ExerciseChart
              id={exercise.id}
              logs={saved.filter(
                (log) => new Date(log.date + "T23:59:59").getTime() >= cutoff,
              )}
            />
          </section>
        </>
      ) : (
        <EmptyState
          title="Your story is just getting started."
          to="/exercises"
          action="Add your first exercise"
        >
          Pick a movement, then log your sets. Your charts and personal bests
          will grow from your own workouts.
        </EmptyState>
      )}
    </>
  );
}
