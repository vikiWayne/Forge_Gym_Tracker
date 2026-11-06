import { ArrowLeft } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { WorkoutForm } from "./WorkoutForm";
export function WorkoutEditorPage() {
  const { exercises, logs } = useTraining();
  const { id } = useParams();
  const [params] = useSearchParams();
  const log = logs.find((item) => item.id === id);
  if (id && !log)
    return (
      <EmptyState
        title="This workout isn’t in your journal."
        to="/workouts"
        action="Back to your workouts"
      >
        It may have been removed, or it belongs to another account.
      </EmptyState>
    );
  if (!exercises.length)
    return (
      <EmptyState
        title="First, pick your movements."
        to="/exercises"
        action="Add an exercise"
      >
        Add an exercise under a category before logging a workout.
      </EmptyState>
    );
  return (
    <>
      <Link to="/workouts" className="back-link">
        <ArrowLeft size={16} />
        Back to your journal
      </Link>
      <PageHeader
        eyebrow="ONE SESSION CLOSER"
        title={id ? "Fine-tune your record." : "Let’s make this one count."}
        description="Every set has a story. Log the weight and reps for each one."
      />
      <div className="editor-layout">
        <section className="panel form-panel">
          <WorkoutForm
            key={id || "new"}
            log={log}
            exerciseId={params.get("exercise") || undefined}
          />
        </section>
        <aside className="editor-note">
          <span>✳</span>
          <h2>Every set counts.</h2>
          <p>
            Warm-up or working set, lighter or heavier. Add a set for each
            round, or repeat the last one when you’re keeping the same weight
            and reps.
          </p>
          <small>HONEST EFFORT. REAL PROGRESS.</small>
        </aside>
      </div>
    </>
  );
}
