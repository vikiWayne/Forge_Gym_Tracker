import { Play } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { MovementDemo } from "./MovementDemo";
import { useStarterCatalog, type CatalogMovement } from "./useStarterCatalog";
import "./starter.css";

export function StarterRoutines({ active }: { active: boolean }) {
  const { catalog, error, retry } = useStarterCatalog();
  const { refresh } = useTraining();
  const action = useAsyncAction();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<CatalogMovement>();

  return (
    <section
      className="starter-section"
      aria-labelledby="starter-routines-heading"
    >
      <div className="section-head">
        <h2 id="starter-routines-heading">Starter routines</h2>
      </div>
      <p className="field-hint">
        Pick a session for your equipment. For dumbbell exercises, enter your
        starting weight before checking each set.
      </p>
      <ErrorMessage message={error || action.error} />
      {error && (
        <button type="button" className="button secondary" onClick={retry}>
          Retry
        </button>
      )}
      {!error && !catalog && <p role="status">Loading starter routines…</p>}
      <div className="routine-grid">
        {catalog?.starters.map((starter) => (
          <article className="panel routine-card" key={starter.id}>
            <h3>{starter.name}</h3>
            <p>{starter.equipment}</p>
            <ol>
              {starter.movements.map(({ id, sets, reps }) => {
                const movement = catalog.movements.find(
                  (item) => item.id === id,
                );
                return (
                  movement && (
                    <li key={id}>
                      <button
                        type="button"
                        className="starter-preview"
                        onClick={() => setPreview(movement)}
                      >
                        {movement.name}
                      </button>
                      <span>
                        {sets} × {reps}
                      </span>
                    </li>
                  )
                );
              })}
            </ol>
            <button
              type="button"
              className="button primary"
              disabled={active || action.pending}
              aria-label={`Start ${starter.name}`}
              onClick={() =>
                void action.run(
                  async () => {
                    await api("/training-session", "POST", {
                      starter_id: starter.id,
                    });
                    void refresh().catch(() => {});
                    navigate("/workouts/active");
                  },
                  { feedback: false },
                )
              }
            >
              <Play size={16} aria-hidden="true" /> Start workout
            </button>
          </article>
        ))}
      </div>
      {preview && (
        <Modal title={preview.name} close={() => setPreview(undefined)}>
          <MovementDemo movement={preview} />
        </Modal>
      )}
    </section>
  );
}
