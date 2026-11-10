import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Download, Share2 } from "lucide-react";
import type { Plan, Routine, WorkoutSet } from "../../shared/api/types";
import { useAuth } from "../../app/providers/AuthProvider";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import "./shared-routines.css";

type SharedRoutine = {
  id: string;
  user_id: string;
  username: string;
  name: string;
  notes: string;
  shared_at: number;
  imported_routine_id: string | null;
  exercises: {
    name: string;
    category: string;
    notes: string;
    sets: WorkoutSet[];
  }[];
};
export function SharedRoutines({ plan }: { plan: Plan }) {
  const { user } = useAuth();
  const { refresh } = useTraining();
  const [shares, setShares] = useState<SharedRoutine[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selected, setSelected] = useState("");
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [removing, setRemoving] = useState<SharedRoutine | null>(null);
  const action = useAsyncAction();
  const load = useCallback(async () => {
    try {
      const [shared, owned] = await Promise.all([
        api<SharedRoutine[]>(`/plans/${plan.id}/routines`),
        api<Routine[]>("/routines"),
      ]);
      setShares(shared);
      setRoutines(owned);
      setLoadError("");
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Shared routines could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [plan.id]);
  useEffect(() => {
    if (plan.accepted) void load();
  }, [load, plan.accepted]);
  if (!plan.accepted) return null;
  function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    void action.run(async () => {
      await api(`/plans/${plan.id}/routines`, "POST", {
        routine_id: selected,
        include_notes: consent,
      });
      setConsent(false);
      setSelected("");
      await load();
      setNotice(
        "Routine snapshot shared. Later edits to your routine stay private until you share it again.",
      );
    });
  }
  return (
    <section className="shared-routines" aria-label="Shared routine templates">
      <div className="section-head">
        <div>
          <h3>
            <BookOpen size={18} />
            Routine exchange
          </h3>
          <p>Trade session templates with accepted members of this plan.</p>
        </div>
        <Link className="text-link" to="/routines">
          My routines →
        </Link>
      </div>
      <ErrorMessage message={loadError || action.error} />
      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <button className="button secondary" onClick={() => void load()}>
          Retry routines
        </button>
      ) : (
        <>
          {routines.length > 0 ? (
            <form className="share-routine-form" onSubmit={publish}>
              <label>
                Routine to share
                <select
                  required
                  value={selected}
                  disabled={action.pending}
                  onChange={(event) => setSelected(event.target.value)}
                >
                  <option value="">Choose a routine</option>
                  {routines.map((routine) => (
                    <option key={routine.id} value={routine.id}>
                      {routine.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="shared-routine-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  required
                  disabled={action.pending}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                <span>
                  Share this routine’s targets, routine notes and exercise notes
                  with accepted plan members. They can keep an independent copy.
                </span>
              </label>
              <button
                className="button secondary"
                disabled={action.pending || !selected || !consent}
              >
                <Share2 size={16} />
                Share routine snapshot
              </button>
            </form>
          ) : (
            <p className="shared-routine-empty">
              Create a routine first to share your training ideas.
            </p>
          )}
          {notice && (
            <p className="success-message" role="status">
              {notice}
            </p>
          )}
          <div className="shared-routine-grid">
            {shares.map((routine) => (
              <article className="shared-routine-card" key={routine.id}>
                <h4>{routine.name}</h4>
                <p>
                  Shared by {routine.username} ·{" "}
                  {new Date(routine.shared_at).toLocaleDateString()}
                </p>
                <p>
                  {routine.exercises.length} movements ·{" "}
                  {routine.exercises.reduce(
                    (sum, exercise) => sum + exercise.sets.length,
                    0,
                  )}{" "}
                  sets
                </p>
                <details>
                  <summary>Review movements and notes</summary>
                  {routine.notes && (
                    <p className="shared-routine-notes">{routine.notes}</p>
                  )}
                  <ol>
                    {routine.exercises.map((exercise, index) => (
                      <li key={index}>
                        <strong>{exercise.name}</strong>
                        <span>
                          {exercise.category} ·{" "}
                          {exercise.sets
                            .map((set) => `${set.weight} kg × ${set.reps}`)
                            .join(" / ")}
                        </span>
                        {exercise.notes && (
                          <p className="shared-routine-notes">
                            {exercise.notes}
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
                <div className="routine-actions">
                  {routine.imported_routine_id ? (
                    <Link className="button secondary" to="/routines">
                      View my copy
                    </Link>
                  ) : (
                    <button
                      className="button secondary"
                      disabled={action.pending}
                      onClick={() =>
                        void action.run(async () => {
                          await api(
                            `/plans/${plan.id}/routines/${routine.id}/import`,
                            "POST",
                          );
                          await refresh();
                          await load();
                          setNotice(
                            "Routine copied into your library. Existing exercise settings were kept; missing movements were created privately.",
                          );
                        })
                      }
                    >
                      <Download size={16} />
                      Copy to my routines
                    </button>
                  )}
                  {routine.user_id === user?.id && (
                    <button
                      className="button subtle"
                      disabled={action.pending}
                      onClick={() => setRemoving(routine)}
                    >
                      Stop sharing
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          {!shares.length && (
            <p className="shared-routine-empty">
              No routine templates shared yet. Workouts and private journals are
              never added here automatically.
            </p>
          )}
        </>
      )}
      {removing && (
        <Modal
          title="Stop sharing this routine?"
          close={() => setRemoving(null)}
        >
          <p>
            Remove “{removing.name}” from this plan’s exchange? Existing copies
            in other members’ libraries remain theirs.
          </p>
          <ErrorMessage message={action.error} />
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setRemoving(null)}
            >
              Keep sharing
            </button>
            <button
              className="button danger"
              disabled={action.pending}
              onClick={() =>
                void action.run(async () => {
                  await api(
                    `/plans/${plan.id}/routines/${removing.id}`,
                    "DELETE",
                  );
                  setRemoving(null);
                  await load();
                })
              }
            >
              Stop sharing
            </button>
          </div>
        </Modal>
      )}
    </section>
  );
}
