import { useState, type ChangeEvent } from "react";
import { Check, Upload } from "lucide-react";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import { checkWorkoutCsv, type CsvSummary } from "./WorkoutCsvApi";
export function WorkoutCsvImport({
  onImported,
  onClose,
}: {
  onImported: () => Promise<void>;
  onClose: () => void;
}) {
  const [csv, setCsv] = useState(""),
    [filename, setFilename] = useState(""),
    [preview, setPreview] = useState<CsvSummary | null>(null),
    [imported, setImported] = useState<CsvSummary | null>(null);
  const { pending, error, run, clearError } = useAsyncAction();
  function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setCsv("");
    setPreview(null);
    setImported(null);
    clearError();
    if (!file) return;
    setFilename(file.name);
    void run(async () => {
      if (file.size > 2 * 1024 * 1024)
        throw new Error("Choose a CSV file no larger than 2 MiB.");
      let text: string;
      try {
        text = new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        );
      } catch {
        throw new Error("Save this CSV with UTF-8 encoding and try again.");
      }
      const summary = await checkWorkoutCsv(text, "preview");
      setCsv(text);
      setPreview(summary);
    });
  }
  if (imported)
    return (
      <div className="csv-result">
        <span className="panel-icon">
          <Check size={25} />
        </span>
        <h3>Your journal has room for more.</h3>
        <p role="status">
          Imported {imported.importing} workout
          {imported.importing === 1 ? "" : "s"} and {imported.sets} set
          {imported.sets === 1 ? "" : "s"}. {imported.skipped} already-present
          workouts were skipped.
        </p>
        <ErrorMessage message={error} />
        <button className="button primary full-width" onClick={onClose}>
          Back to my journal
        </button>
      </div>
    );
  return (
    <>
      <p className="modal-description">
        Bring in a FORGE CSV export, with one row per set. Review what will be
        added before importing. Existing workouts are never overwritten.
      </p>
      <label>
        Workout CSV file
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={select}
          disabled={pending}
        />
      </label>
      <p className="field-hint">
        UTF-8 · up to 2 MiB · up to 10,000 set rows. Export an empty journal for
        a header-only template.
      </p>
      <ErrorMessage message={error} />
      {preview && (
        <div className="csv-preview">
          <h3>Ready to review: {filename}</h3>
          <dl>
            <div>
              <dt>Workouts to add</dt>
              <dd>{preview.importing}</dd>
            </div>
            <div>
              <dt>Sets to add</dt>
              <dd>{preview.sets}</dd>
            </div>
            <div>
              <dt>Already present</dt>
              <dd>{preview.skipped}</dd>
            </div>
            <div>
              <dt>New categories</dt>
              <dd>{preview.newCategories}</dd>
            </div>
            <div>
              <dt>New exercises</dt>
              <dd>{preview.newExercises}</dd>
            </div>
          </dl>
          {preview.settingsKept > 0 && (
            <p className="field-hint">
              Existing exercise notes and rep ranges will be kept for{" "}
              {preview.settingsKept} imported workouts.
            </p>
          )}
          {preview.preview.length > 0 ? (
            <div className="table-scroll">
              <table>
                <caption className="sr-only">
                  Import preview, first 20 workouts
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Movement</th>
                    <th scope="col">Sets</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.preview.map((workout) => (
                    <tr key={workout.id}>
                      <td>{formatDate(workout.date)}</td>
                      <td>
                        {workout.exercise}
                        <small>{workout.category}</small>
                      </td>
                      <td>{workout.sets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.importing > 20 && (
                <p className="field-hint">
                  Showing the first 20 of {preview.importing} workouts to add.
                </p>
              )}
            </div>
          ) : (
            <p className="success-message">
              Everything in this file is already in your journal. Nothing will
              be added.
            </p>
          )}
          <p className="field-hint">
            Any missing categories and exercises listed above will be created in
            your library. Duplicate source IDs are skipped; changed versions of
            an existing source ID must be resolved before importing.
          </p>
          <button
            className="button primary full-width"
            disabled={pending || preview.importing === 0}
            onClick={() =>
              void run(async () => {
                const result = await checkWorkoutCsv(csv, "import");
                setImported(result);
                await onImported();
              })
            }
          >
            <Upload size={17} />
            {pending
              ? "Importing…"
              : `Import ${preview.importing} workout${preview.importing === 1 ? "" : "s"}`}
          </button>
        </div>
      )}
    </>
  );
}
