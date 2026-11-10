import { useEffect, useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Modal } from "../../shared/ui/Modal";
import { RestTimer, clockText } from "../workouts/RestTimer";
import { useActiveSession } from "./useActiveSession";
import { SessionMovement } from "./SessionMovement";

export function ActiveWorkoutPage() {
  const state = useActiveSession();
  const { logs, refresh } = useTraining();
  const action = useAsyncAction();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());
  const [discarding, setDiscarding] = useState(false);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const { session } = state;
  if (state.loading) return <LoadingState />;
  if (!session)
    return (
      <>
        <ErrorMessage message={state.error} />
        {state.error ? (
          <button
            className="button secondary"
            onClick={() => void state.reload()}
          >
            Try again
          </button>
        ) : (
          <EmptyState
            title="Ready for your next workout?"
            to="/routines"
            action="Choose a routine"
          >
            Start a routine to track sets, time your rests and save your
            session.
          </EmptyState>
        )}
      </>
    );
  const total = session.exercises.reduce(
    (sum, item) => sum + item.sets.length,
    0,
  );
  const done = session.exercises.reduce(
    (sum, item) => sum + item.sets.filter((set) => set.done).length,
    0,
  );
  function finish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action.run(async () => {
      await state.flush();
      await api(`/training-session/${session!.id}/finish`, "POST");
      state.completed();
      await refresh();
      navigate("/workouts");
    });
  }
  return (
    <>
      <PageHeader
        eyebrow="ONE SET AT A TIME"
        title={session.name}
        description="Adjust each target to your actual result, then check the set when you finish."
      />
      <div className="session-summary">
        <strong>
          {clockText(
            Math.max(0, Math.floor((now - session.started_at) / 1000)),
          )}
        </strong>
        <span>session duration</span>
        <strong>
          {done}/{total}
        </strong>
        <span>sets completed</span>
        <span role="status">
          {state.saving
            ? "Saving…"
            : state.error
              ? "Changes not saved"
              : "All changes saved"}
        </span>
      </div>
      <ErrorMessage message={state.error || action.error} />
      {state.error && (
        <button
          className="button secondary"
          onClick={() =>
            void action.run(async () => {
              await state.flush();
            })
          }
        >
          Retry save
        </button>
      )}
      <RestTimer
        session={session}
        now={now}
        disabled={action.pending}
        onChange={(patch) => state.change({ ...session, ...patch })}
      />
      <form onSubmit={finish}>
        {session.exercises.map((item, index) => (
          <SessionMovement
            key={index}
            item={item}
            index={index}
            logs={logs}
            disabled={action.pending}
            onChange={(next) =>
              state.change({
                ...session,
                exercises: session.exercises.map((row, i) =>
                  i === index ? next : row,
                ),
                rest_until: next.sets.some(
                  (set, i) => set.done && !item.sets[i].done,
                )
                  ? Date.now() + session.rest_seconds * 1000
                  : session.rest_until,
              })
            }
            onRest={() => setNow(Date.now())}
          />
        ))}
        <label>
          Session notes
          <textarea
            maxLength={1000}
            value={session.notes}
            disabled={action.pending}
            onChange={(event) =>
              state.change({ ...session, notes: event.target.value })
            }
          />
        </label>
        <p className="field-hint">
          Only checked sets are added to your journal. Unchecked sets are left
          out. Workouts use the session’s start date.
        </p>
        <div className="form-actions session-actions">
          <button
            type="button"
            className="button secondary"
            disabled={action.pending}
            onClick={() =>
              void action.run(async () => {
                await state.flush();
                navigate("/routines");
              })
            }
          >
            Pause
          </button>
          <button
            type="button"
            className="button subtle session-discard"
            aria-label="Discard workout"
            title="Discard workout"
            disabled={action.pending}
            onClick={() => setDiscarding(true)}
          >
            <Trash2 size={18} />
          </button>
          <button className="button primary" disabled={action.pending || !done}>
            {action.pending ? (
              "Finishing…"
            ) : (
              <>
                Finish workout <span className="finish-count">{done}</span>
              </>
            )}
          </button>
        </div>
      </form>
      {discarding && (
        <Modal title="Discard this workout?" close={() => setDiscarding(false)}>
          <p>
            Your completed sets in this active session will not be added to your
            journal.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDiscarding(false)}
            >
              Keep training
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await state.discard();
                  navigate("/routines");
                })
              }
            >
              Discard workout
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
