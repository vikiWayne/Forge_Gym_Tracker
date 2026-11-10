import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  EmptyState,
  ErrorMessage,
  LoadingState,
} from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { AlternativeForm } from "./AlternativeForm";
import type { Alternative } from "./types";
import "./alternatives.css";
export function AlternativesPage() {
  const { exercises } = useTraining();
  const [links, setLinks] = useState<Alternative[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selected, setSelected] = useState("");
  const [editing, setEditing] = useState<Alternative | null | undefined>();
  const action = useAsyncAction();
  const load = useCallback(async () => {
    try {
      const result = await api<{ alternatives: Alternative[] }>(
        "/alternatives",
      );
      setLinks(result.alternatives);
      setLoadError("");
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Alternatives could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const shown = links.filter(
    (link) =>
      !selected || link.exercise_a === selected || link.exercise_b === selected,
  );
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE FLEXIBILITY GOES A LONG WAY"
        title="Keep a backup movement ready."
        description="Link exercises you like to substitute, with your own equipment and setup notes."
        action={
          exercises.length >= 2 && (
            <button className="button primary" onClick={() => setEditing(null)}>
              <Plus size={17} />
              Link alternatives
            </button>
          )
        }
      />
      <ErrorMessage message={loadError || action.error} />
      {loadError && (
        <button className="button secondary" onClick={() => void load()}>
          Try again
        </button>
      )}
      <div className="list-toolbar">
        <label className="inline-label">
          Movement
          <select
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            <option value="">All exercises</option>
            {exercises.map((exercise) => (
              <option value={exercise.id} key={exercise.id}>
                {exercise.name}
              </option>
            ))}
          </select>
        </label>
        <p>
          {shown.length} linked {shown.length === 1 ? "pair" : "pairs"}
        </p>
      </div>
      {loading ? (
        <LoadingState />
      ) : shown.length ? (
        <div className="alternatives-grid">
          {shown.map((link) => (
            <section className="panel alternative-card" key={link.id}>
              <span className="panel-icon">
                <ArrowLeftRight size={21} />
              </span>
              <h2>
                {link.name_a}{" "}
                <span aria-label="is interchangeable with">↔</span>{" "}
                {link.name_b}
              </h2>
              <p>
                {link.category_a} · {link.category_b}
              </p>
              {link.note && <p className="alternative-note">{link.note}</p>}
              <div className="alternative-actions">
                <Link
                  className="button secondary"
                  to={`/workouts/new?exercise=${link.exercise_a}`}
                >
                  Log {link.name_a}
                </Link>
                <Link
                  className="button secondary"
                  to={`/workouts/new?exercise=${link.exercise_b}`}
                >
                  Log {link.name_b}
                </Link>
              </div>
              <div className="alternative-actions">
                <button
                  className="button subtle"
                  onClick={() => setEditing(link)}
                >
                  Edit note
                </button>
                <button
                  className="button subtle"
                  disabled={action.pending}
                  onClick={() =>
                    void action.run(async () => {
                      await api(`/alternatives/${link.id}`, "DELETE");
                      await load();
                    })
                  }
                >
                  Unlink exercises
                </button>
              </div>
            </section>
          ))}
        </div>
      ) : (
        !loadError && (
          <EmptyState
            title={
              selected
                ? "No alternatives linked to this movement."
                : "A backup plan can keep you moving."
            }
            to={exercises.length < 2 ? "/exercises" : undefined}
            action="Add exercises"
          >
            {exercises.length < 2
              ? "Add at least two exercises to your library before linking alternatives."
              : "Link two movements and keep your own substitution notes here. Your existing routine is never changed automatically."}
          </EmptyState>
        )
      )}
      {editing !== undefined && (
        <Modal
          title={editing ? "Edit substitution note" : "Link two exercises"}
          close={() => setEditing(undefined)}
        >
          <AlternativeForm
            link={editing || undefined}
            onSaved={async () => {
              await load();
              setEditing(undefined);
            }}
          />
        </Modal>
      )}
    </>
  );
}
