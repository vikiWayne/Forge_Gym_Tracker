import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Plus } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import type { Routine } from "../../shared/api/types";
import { localDate, formatDate } from "../../shared/lib/dates";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { PageHeader } from "../../shared/ui/PageHeader";
import { Modal } from "../../shared/ui/Modal";
import { ScheduleForm } from "./ScheduleForm";
import { ScheduleCompletion } from "./ScheduleCompletion";
import { ScheduleSummary } from "./ScheduleSummary";
import type { CompletedSession, ScheduledWorkout } from "./types";
import "./schedule.css";

export function SchedulePage() {
  const { logs, exercises } = useTraining();
  const [entries, setEntries] = useState<ScheduledWorkout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [sessions, setSessions] = useState<CompletedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [filter, setFilter] = useState("upcoming");
  const [editing, setEditing] = useState<ScheduledWorkout | null | undefined>();
  const [completing, setCompleting] = useState<ScheduledWorkout | null>(null);
  const [deleting, setDeleting] = useState<ScheduledWorkout | null>(null);
  const action = useAsyncAction();
  const navigate = useNavigate();
  const today = localDate();
  async function refresh() {
    const [schedule, routineList, completed] = await Promise.all([
      api<{ entries: ScheduledWorkout[] }>("/schedule"),
      api<Routine[]>("/routines"),
      api<CompletedSession[]>("/training-sessions"),
    ]);
    setEntries(schedule.entries);
    setRoutines(routineList);
    setSessions(completed);
    setLoadError("");
  }
  useEffect(() => {
    void refresh()
      .catch((cause) => setLoadError(cause.message))
      .finally(() => setLoading(false));
  }, []);
  const visible = entries.filter(
    (entry) =>
      filter === "all" ||
      (filter === "upcoming"
        ? entry.date >= today && !entry.completed_at
        : entry.date < today || !!entry.completed_at),
  );
  if (filter === "history")
    visible.sort((a, b) => b.date.localeCompare(a.date));
  async function saved() {
    await refresh();
    setEditing(undefined);
    setCompleting(null);
  }
  return (
    <>
      <PageHeader
        eyebrow="MAKE ROOM FOR YOUR NEXT SESSION"
        title="Your workout schedule."
        description="Plan a routine, do the work, then link the saved session to see what you completed."
        action={
          routines.length > 0 && (
            <button className="button primary" onClick={() => setEditing(null)}>
              <Plus size={17} />
              Plan workout
            </button>
          )
        }
      />
      <ScheduleSummary entries={entries} today={today} />
      <ErrorMessage message={loadError || action.error} />
      {loadError && (
        <button
          className="button secondary"
          onClick={() => void action.run(refresh)}
        >
          Try again
        </button>
      )}
      <div className="schedule-toolbar">
        <label className="inline-label">
          Show
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="upcoming">Upcoming</option>
            <option value="history">History</option>
            <option value="all">All plans</option>
          </select>
        </label>
        <Link className="text-link" to="/routines">
          Routines & active workout →
        </Link>
      </div>
      {loading ? (
        <LoadingState />
      ) : visible.length ? (
        <div className="schedule-list">
          {visible.map((entry) => (
            <article className="panel schedule-card" key={entry.id}>
              <div className="schedule-card-heading">
                <span className="panel-icon">
                  <CalendarDays size={22} />
                </span>
                <div>
                  <h2>{entry.routine_name}</h2>
                  <p>{formatDate(entry.date)}</p>
                </div>
                <span
                  className={`schedule-status ${entry.completed_at ? "schedule-complete" : ""}`}
                >
                  {entry.completed_at
                    ? "Marked completed"
                    : entry.date < today
                      ? "Past plan · not completed"
                      : "Planned"}
                </span>
              </div>
              {entry.notes && <p className="schedule-notes">{entry.notes}</p>}
              <p className="field-hint">
                {entry.logged_workouts} saved exercise{" "}
                {entry.logged_workouts === 1 ? "log" : "logs"} on this date.
                {!entry.completed_at && entry.logged_workouts > 0
                  ? " Link the work that fulfilled this plan below."
                  : ""}
              </p>
              {!entry.routine_id && (
                <p className="field-hint">
                  This routine was deleted. Your plan is kept; edit it to choose
                  another routine.
                </p>
              )}
              <div className="schedule-actions">
                {!entry.completed_at &&
                  entry.routine_id &&
                  entry.date === today && (
                    <button
                      className="button primary"
                      disabled={action.pending}
                      onClick={() =>
                        void action.run(async () => {
                          await api("/training-session", "POST", {
                            routine_id: entry.routine_id,
                          });
                          navigate("/workouts/active");
                        })
                      }
                    >
                      Start routine
                    </button>
                  )}
                {!entry.completed_at && (
                  <button
                    className="button secondary"
                    disabled={action.pending || entry.date > today}
                    onClick={() => setCompleting(entry)}
                  >
                    Mark completed
                  </button>
                )}
                {entry.completed_at ? (
                  <button
                    className="button secondary"
                    disabled={action.pending}
                    onClick={() =>
                      void action.run(async () => {
                        await api(`/schedule/${entry.id}/completion`, "DELETE");
                        await refresh();
                      })
                    }
                  >
                    Reopen plan
                  </button>
                ) : (
                  <button
                    className="button secondary"
                    disabled={action.pending || !routines.length}
                    onClick={() => setEditing(entry)}
                  >
                    Edit plan
                  </button>
                )}
                <button
                  className="button subtle"
                  disabled={action.pending}
                  onClick={() => setDeleting(entry)}
                >
                  Delete plan
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !loadError && (
          <EmptyState
            title={
              entries.length
                ? "No plans in this view."
                : "Give your next session a date."
            }
            to={routines.length ? undefined : "/routines"}
            action="Create a routine"
          >
            {routines.length
              ? "Use Plan workout to choose a routine and a date. Future dates are welcome."
              : "Create a routine first, then plan when you want to train."}
          </EmptyState>
        )
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit planned workout" : "Plan a workout"}
          close={() => setEditing(undefined)}
        >
          <ScheduleForm
            entry={editing || undefined}
            routines={routines}
            onSaved={saved}
          />
        </Modal>
      )}
      {completing && (
        <Modal
          title="Link your completed work"
          close={() => setCompleting(null)}
        >
          <ScheduleCompletion
            entry={completing}
            sessions={sessions}
            logs={logs}
            exercises={exercises}
            onSaved={saved}
          />
        </Modal>
      )}
      {deleting && (
        <Modal title="Delete this plan?" close={() => setDeleting(null)}>
          <p>
            Remove “{deleting.routine_name}” from {formatDate(deleting.date)}?
            Your routine and saved workout logs stay in your account.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
            >
              Keep plan
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(`/schedule/${deleting.id}`, "DELETE");
                  await refresh();
                  setDeleting(null);
                })
              }
            >
              Delete plan
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
