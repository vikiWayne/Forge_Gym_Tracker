import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { Exercise } from "../../shared/api/types";
import { api } from "../../shared/api/client";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { Modal } from "../../shared/ui/Modal";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { ExerciseForm } from "./ExerciseForm";
export function ExerciseActions({ exercise }: { exercise: Exercise }) {
  const [dialog, setDialog] = useState<"edit" | "delete" | null>(null);
  const { logs, refresh } = useTraining();
  const { pending, error, run, clearError } = useAsyncAction();
  const count = logs.filter((log) => log.exercise_id === exercise.id).length;
  function close() {
    setDialog(null);
    clearError();
  }
  return (
    <>
      <div className="exercise-action-buttons">
        <button className="button subtle" onClick={() => setDialog("edit")}>
          <Pencil size={14} />
          Edit exercise
        </button>
        <button
          className="icon-button"
          aria-label={`Delete exercise: ${exercise.name}`}
          onClick={() => setDialog("delete")}
        >
          <Trash2 size={15} />
        </button>
      </div>
      {dialog && (
        <Modal
          title={
            dialog === "edit" ? "Edit your exercise" : "Delete this exercise?"
          }
          close={close}
        >
          {dialog === "edit" ? (
            <ExerciseForm exercise={exercise} onSaved={close} />
          ) : (
            <>
              <p className="modal-description">
                Delete “{exercise.name}”?{" "}
                {count
                  ? `This also permanently deletes its ${count} workout log${count === 1 ? "" : "s"} and all associated sets, including from shared plans and progress charts.`
                  : "This exercise has no workout logs."}{" "}
                This cannot be undone.
              </p>
              <ErrorMessage message={error} />
              <div className="form-actions">
                <button className="button secondary" onClick={close}>
                  Keep exercise
                </button>
                <button
                  className="button danger"
                  disabled={pending}
                  onClick={() =>
                    void run(async () => {
                      await api(`/exercises/${exercise.id}`, "DELETE");
                      await refresh();
                      close();
                    })
                  }
                >
                  {pending ? "Deleting…" : "Delete exercise"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}
    </>
  );
}
