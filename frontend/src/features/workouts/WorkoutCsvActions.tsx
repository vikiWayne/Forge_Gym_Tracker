import { useState } from "react";
import { FileOutput, FileInput } from "lucide-react";
import { useTraining } from "../../app/providers/TrainingProvider";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { Modal } from "../../shared/ui/Modal";
import { downloadWorkoutCsv } from "./WorkoutCsvApi";
import { WorkoutCsvImport } from "./WorkoutCsvImport";
export function WorkoutCsvActions() {
  const [open, setOpen] = useState(false);
  const { refresh } = useTraining();
  const { pending, error, run } = useAsyncAction();
  return (
    <section className="workout-csv-actions" aria-label="Workout CSV transfer">
      <div>
        <strong>Your journal, to go.</strong>
        <p>
          Export all workout sets, or review a CSV before adding it to your
          account.
        </p>
      </div>
      <div className="csv-buttons">
        <button
          className="button secondary"
          disabled={pending}
          onClick={() => void run(downloadWorkoutCsv)}
        >
          <FileOutput size={17} />
          {pending ? "Exporting…" : "Export CSV"}
        </button>
        <button className="button secondary" onClick={() => setOpen(true)}>
          <FileInput size={17} />
          Import CSV
        </button>
      </div>
      <ErrorMessage message={error} />
      {open && (
        <Modal title="Bring your workouts along" close={() => setOpen(false)}>
          <WorkoutCsvImport
            onImported={refresh}
            onClose={() => setOpen(false)}
          />
        </Modal>
      )}
    </section>
  );
}
