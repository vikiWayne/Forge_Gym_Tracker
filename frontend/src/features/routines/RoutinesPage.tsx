import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Play, Plus } from "lucide-react";
import { api } from "../../shared/api/client";
import type { Routine, TrainingSession } from "../../shared/api/types";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { RoutineForm } from "./RoutineForm";
import { clockText } from "../workouts/RestTimer";
import { formatDate, localDate } from "../../shared/lib/dates";
type CompletedSession = {
  id: string;
  name: string;
  started_at: number;
  finished_at: number;
};

export function RoutinesPage() {
  const { exercises } = useTraining();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [active, setActive] = useState<TrainingSession | null>(null);
  const [history, setHistory] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Routine | null | undefined>();
  const [deleting, setDeleting] = useState<Routine | null>(null);
  const action = useAsyncAction();
  const navigate = useNavigate();
  async function refresh() {
    const [list, session, recent] = await Promise.all([
      api<Routine[]>("/routines"),
      api<TrainingSession | null>("/training-session"),
      api<CompletedSession[]>("/training-sessions"),
    ]);
    setRoutines(list);
    setActive(session);
    setHistory(recent);
  }
  useEffect(() => {
    void action
      .run(refresh, { feedback: false })
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="YOUR TRAINING, READY TO GO"
        title="Build your next session."
        description="Save your favorite sessions, then follow them one set at a time."
        action={
          exercises.length > 0 && (
            <button className="button primary" onClick={() => setEditing(null)}>
              <Plus size={17} />
              New routine
            </button>
          )
        }
      />
      <ErrorMessage message={action.error} />
      {active && (
        <section className="panel active-workout-banner">
          <div>
            <h2>{active.name} is in progress</h2>
            <p>Your checked sets and timer are saved as you train.</p>
          </div>
          <Link className="button primary" to="/workouts/active">
            Resume workout
          </Link>
        </section>
      )}
      {loading ? (
        <LoadingState />
      ) : routines.length ? (
        <div className="routine-grid">
          {routines.map((routine) => (
            <section className="panel routine-card" key={routine.id}>
              <h2>{routine.name}</h2>
              <p>
                {routine.exercises.length}{" "}
                {routine.exercises.length === 1 ? "movement" : "movements"} ·{" "}
                {routine.exercises.reduce(
                  (sum, item) => sum + item.sets.length,
                  0,
                )}{" "}
                sets
              </p>
              <ol>
                {routine.exercises.map((item, index) => (
                  <li key={index}>
                    {exercises.find(
                      (exercise) => exercise.id === item.exercise_id,
                    )?.name || "Deleted exercise — edit routine"}
                    <span>
                      {item.sets.length}{" "}
                      {item.sets.length === 1 ? "set" : "sets"}
                    </span>
                  </li>
                ))}
              </ol>
              {routine.notes && (
                <p className="routine-notes">{routine.notes}</p>
              )}
              <div className="routine-actions">
                <button
                  className="button primary"
                  disabled={action.pending || !!active}
                  onClick={() =>
                    void action.run(async () => {
                      await api("/training-session", "POST", {
                        routine_id: routine.id,
                      });
                      navigate("/workouts/active");
                    })
                  }
                >
                  <Play size={16} />
                  Start workout
                </button>
                <button
                  className="button secondary"
                  onClick={() => setEditing(routine)}
                >
                  Edit
                </button>
                <button
                  className="button subtle"
                  onClick={() => setDeleting(routine)}
                >
                  Delete
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        !action.error && (
          <EmptyState
            title="Your next workout starts here."
            to={exercises.length ? undefined : "/exercises"}
            action="Add exercises"
          >
            {exercises.length
              ? "Create a routine with the movements, weights and reps you want to train."
              : "Add exercises to your library before building your first routine."}
          </EmptyState>
        )
      )}
      {!loading && action.error && (
        <button
          className="button secondary"
          onClick={() => void action.run(refresh)}
        >
          Try again
        </button>
      )}
      {history.length > 0 && (
        <section className="panel session-history">
          <h2>Recent completed sessions</h2>
          <ul>
            {history.map((session) => (
              <li key={session.id}>
                <strong>{session.name}</strong>
                <span>
                  {formatDate(localDate(new Date(session.started_at)))} ·{" "}
                  {clockText(
                    Math.floor(
                      (session.finished_at - session.started_at) / 1000,
                    ),
                  )}{" "}
                  duration
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit routine" : "Create routine"}
          close={() => setEditing(undefined)}
        >
          <RoutineForm
            routine={editing || undefined}
            onSaved={async () => {
              await refresh();
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this routine?" close={() => setDeleting(null)}>
          <p>
            Delete “{deleting.name}”? Your saved workouts and active session
            stay in your account.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep routine
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(`/routines/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              Delete routine
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
