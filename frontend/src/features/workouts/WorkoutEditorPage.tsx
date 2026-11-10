import { ArrowLeft } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { PageHeader } from "../../shared/ui/PageHeader";
import { EmptyState } from "../../shared/ui/Feedback";
import { WorkoutForm } from "./WorkoutForm";
import { copyWorkoutDraft } from "./copyWorkout";
import { localDate } from "../../shared/lib/dates";
export function WorkoutEditorPage() {
  const { exercises, logs } = useTraining();
  const { id } = useParams();
  const [params] = useSearchParams();
  const log = logs.find((item) => item.id === id);
  const copyId = !id ? params.get("copy") : null;
  const source = copyId
    ? logs.find((item) => item.id === copyId && !item.pending_sync)
    : undefined;
  if (
    copyId !== null &&
    (!source ||
      !exercises.some((exercise) => exercise.id === source.exercise_id))
  )
    return (
      <EmptyState
        title="This workout can’t be copied."
        to="/workouts"
        action="Back to your workouts"
      >
        Choose a saved workout from your own journal. It may have been removed,
        or it is still waiting to sync.
      </EmptyState>
    );
  if (log?.pending_sync)
    return (
      <EmptyState
        title="This workout is waiting to sync."
        to="/workouts"
        action="Back to your workouts"
      >
        Reconnect and let this workout sync before editing it.
      </EmptyState>
    );
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
        title={
          id
            ? "Fine-tune your record."
            : source
              ? "Make this workout your next one."
              : "Let’s make this one count."
        }
        description={
          source
            ? "Review the copied sets and notes, then save a new workout. The original stays unchanged."
            : "Every set has a story. Log the weight and reps for each one."
        }
      />
      {!id && (
        <p className="routine-entry-link">
          <Link className="text-link" to="/routines">
            Prefer to follow a routine? Start or resume a workout →
          </Link>
        </p>
      )}
      <div className="editor-layout">
        <section className="panel form-panel">
          <WorkoutForm
            key={id || copyId || params.get("exercise") || "new"}
            log={log}
            duplicate={
              source ? copyWorkoutDraft(source, localDate()) : undefined
            }
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
