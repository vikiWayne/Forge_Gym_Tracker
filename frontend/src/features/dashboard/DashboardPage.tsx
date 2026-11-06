import { StreakCard } from "../streak/StreakCard";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { OverviewIllustration } from "./OverviewIllustration";
import { ExerciseChart } from "../progress/ExerciseChart";
import { WorkoutTable } from "../workouts/WorkoutTable";
import { StatsGrid } from "./StatsGrid";
import { WeeklyActivity } from "./WeeklyActivity";
export function DashboardPage() {
  const { user } = useAuth();
  const { logs, exercises } = useTraining();
  const [selected, setSelected] = useState("");
  const exercise =
    exercises.find((item) => item.id === selected) || exercises[0];
  return (
    <>
      <PageHeader
        eyebrow="YOUR DAILY DOSE OF STRONG"
        title={`Hey ${user?.username}. You’ve got this.`}
        description="A fresh day. A little more possibility. Let’s make it yours."
      />
      <section className="welcome-banner">
        <div>
          <span className="banner-label">
            <Sparkles size={14} /> BUILT ONE REP AT A TIME
          </span>
          <h2>
            You’re not starting over.
            <br />
            You’re <em>building yourself.</em>
          </h2>
          <p>Show up for your goals. We’ll keep track of the good stuff.</p>
          <Link className="button banner-button" to="/exercises">
            {exercises.length
              ? "Explore your exercises"
              : "Start with an exercise"}
            <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="banner-art overview-illustration-art">
          <OverviewIllustration />
        </div>
        <span className="banner-sparkle">✳</span>
      </section>
      <StreakCard />
      <StatsGrid logs={logs} exercises={exercises} />
      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-head">
            <div>
              <span className="section-kicker">YOUR HARD WORK, VISUALIZED</span>
              <h2>A little stronger than before</h2>
            </div>
            {exercise && (
              <select
                aria-label="Exercise to chart"
                value={exercise.id}
                onChange={(event) => setSelected(event.target.value)}
              >
                {exercises.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {exercise ? (
            <ExerciseChart
              id={`overview-${exercise.id}`}
              logs={logs.filter((log) => log.exercise_id === exercise.id)}
            />
          ) : (
            <EmptyState
              title="Your strength story starts here."
              to="/exercises"
              action="Add an exercise"
            >
              Add a movement, then log your first session. Every point on this
              chart will be yours.
            </EmptyState>
          )}
        </section>
        <WeeklyActivity logs={logs} />
      </div>
      <section className="panel activity-panel">
        <div className="section-head">
          <div>
            <span className="section-kicker">THE WORK YOU PUT IN</span>
            <h2>Fresh from your journal</h2>
          </div>
          <Link className="text-link" to="/workouts">
            View all workouts
            <ArrowRight size={15} />
          </Link>
        </div>
        {logs.length ? (
          <WorkoutTable logs={logs.slice(0, 4)} exercises={exercises} />
        ) : (
          <EmptyState
            title="Good things are on the way."
            to={exercises.length ? undefined : "/exercises"}
            action={exercises.length ? undefined : "Add your first movement"}
          >
            No workouts yet. Use the Log workout action in the header or mobile
            navigation to start your journal.
          </EmptyState>
        )}
      </section>
    </>
  );
}
