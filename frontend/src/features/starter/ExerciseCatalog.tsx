import { useState } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { MovementDemo } from "./MovementDemo";
import { useStarterCatalog } from "./useStarterCatalog";
import "./starter.css";

export function ExerciseCatalog({ close }: { close: () => void }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("");
  const [added, setAdded] = useState<string[]>([]);
  const { exercises, refresh } = useTraining();
  const { catalog, error, retry } = useStarterCatalog();
  const action = useAsyncAction();
  const movement = catalog?.movements.find((entry) => entry.id === selected);
  const results = catalog?.movements.filter((entry) =>
    `${entry.name} ${entry.equipment} ${entry.focus}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const inLibrary =
    movement &&
    (added.includes(movement.id) ||
      exercises.some(
        (entry) => entry.name.toLowerCase() === movement.name.toLowerCase(),
      ));
  return (
    <Modal title={movement?.name ?? "Browse exercises"} close={close}>
      {movement ? (
        <>
          <button
            type="button"
            className="button subtle"
            onClick={() => {
              action.clearError();
              setSelected("");
            }}
          >
            <ArrowLeft size={16} aria-hidden="true" /> All movements
          </button>
          <p className="field-hint">
            {movement.focus} · {movement.equipment}
          </p>
          <MovementDemo key={movement.id} movement={movement} />
          <ErrorMessage message={action.error} />
          <button
            type="button"
            className="button primary"
            disabled={action.pending || inLibrary}
            onClick={() =>
              void action.run(async () => {
                await api(`/starter-catalog/movements/${movement.id}`, "POST");
                setAdded((entries) => [...entries, movement.id]);
                await refresh();
              })
            }
          >
            {inLibrary
              ? "In your library"
              : action.pending
                ? "Adding…"
                : "Add to my library"}
          </button>
        </>
      ) : (
        <>
          <label className="catalog-search">
            Find a movement
            <input
              type="search"
              value={query}
              placeholder="Try chest or dumbbells"
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <ErrorMessage message={error} />
          {error && (
            <button type="button" className="button secondary" onClick={retry}>
              Retry
            </button>
          )}
          {!error && !catalog && <p role="status">Loading movements…</p>}
          {results?.length === 0 && <p>No movements match your search.</p>}
          <ul className="catalog-results">
            {results?.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setSelected(entry.id)}
                >
                  <span>
                    {entry.name}
                    <br />
                    <small>
                      {entry.focus} · {entry.equipment}
                    </small>
                  </span>
                  <ChevronRight size={18} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Modal>
  );
}
