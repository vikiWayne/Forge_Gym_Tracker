import { useState } from "react";
import { TrendingUp } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { ExerciseChart } from "./ExerciseChart";
export function ProgressPage() {
  const { exercises, logs } = useTraining();
  const [range, setRange] = useState("90");
  const cutoff = Date.now() - Number(range) * 86400000;
  return (
    <>
      <PageHeader
        eyebrow="PROOF OF YOUR PERSISTENCE"
        title="Every rep adds up."
        description="A separate story for every movement. Watch yours unfold."
        action={
          <label className="inline-label">
            Time range
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="36500">All time</option>
            </select>
          </label>
        }
      />
      {exercises.length ? (
        <div className="progress-grid">
          {exercises.map((exercise) => (
            <section className="panel" key={exercise.id}>
              <div className="section-head">
                <div>
                  <span className="section-kicker">{exercise.category}</span>
                  <h2>{exercise.name}</h2>
                </div>
                <span className="panel-icon">
                  <TrendingUp size={20} />
                </span>
              </div>
              <ExerciseChart
                id={exercise.id}
                logs={logs.filter(
                  (log) =>
                    log.exercise_id === exercise.id &&
                    new Date(`${log.date}T23:59:59`).getTime() >= cutoff,
                )}
              />
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Give your progress a place to grow."
          to="/exercises"
          action="Add your first exercise"
        >
          Your charts will be built from your own workout logs. No made-up
          milestones.
        </EmptyState>
      )}
    </>
  );
}
