import type { Log, TrainingSession } from "../../shared/api/types";
import { PreviousSession, previousSession } from "../workouts/PreviousSession";
import { localDate } from "../../shared/lib/dates";
import { EffortFields } from "../workouts/EffortFields";
type Movement = TrainingSession["exercises"][number];
export function SessionMovement({
  item,
  index,
  logs,
  disabled,
  onChange,
  onRest,
}: {
  item: Movement;
  index: number;
  logs: Log[];
  disabled: boolean;
  onChange: (item: Movement) => void;
  onRest: () => void;
}) {
  return (
    <fieldset className="panel session-movement" disabled={disabled}>
      <legend>
        {index + 1}. {item.name}
      </legend>
      <PreviousSession
        log={previousSession(logs, item.exercise_id, localDate())}
      />
      <div className="session-set-heading" aria-hidden="true">
        <span>Set</span>
        <span>kg</span>
        <span>Reps</span>
        <span>Done</span>
      </div>
      {item.sets.map((set, position) => (
        <div className="session-set-entry" key={position}>
          <div className={`session-set ${set.done ? "set-completed" : ""}`}>
            <strong>{position + 1}</strong>
            <label>
              <span className="sr-only">
                {item.name}, set {position + 1} weight
              </span>
              <input
                type="number"
                min={0}
                max={1500}
                step="0.01"
                required
                value={set.weight}
                disabled={set.done}
                onChange={(event) =>
                  onChange({
                    ...item,
                    sets: item.sets.map((row, i) =>
                      i === position
                        ? { ...row, weight: Number(event.target.value) }
                        : row,
                    ),
                  })
                }
              />
            </label>
            <label>
              <span className="sr-only">
                {item.name}, set {position + 1} reps
              </span>
              <input
                type="number"
                min={1}
                max={1000}
                step={1}
                required
                value={set.reps}
                disabled={set.done}
                onChange={(event) =>
                  onChange({
                    ...item,
                    sets: item.sets.map((row, i) =>
                      i === position
                        ? { ...row, reps: Number(event.target.value) }
                        : row,
                    ),
                  })
                }
              />
            </label>
            <label className="session-done">
              <span className="sr-only">
                Complete {item.name}, set {position + 1}
              </span>
              <input
                type="checkbox"
                checked={set.done}
                onChange={(event) => {
                  const inputs = event.currentTarget
                    .closest(".session-set-entry")
                    ?.querySelectorAll<HTMLInputElement>("input[type=number]");
                  if (
                    inputs &&
                    [...inputs].some((input) => !input.reportValidity())
                  )
                    return;
                  onChange({
                    ...item,
                    sets: item.sets.map((row, i) =>
                      i === position ? { ...row, done: !row.done } : row,
                    ),
                  });
                  if (!set.done) onRest();
                }}
              />
            </label>
          </div>
          <EffortFields
            label={`${item.name}, set ${position + 1}`}
            rpe={set.rpe == null ? "" : String(set.rpe)}
            rir={set.rir == null ? "" : String(set.rir)}
            disabled={set.done}
            onChange={(field, value) =>
              onChange({
                ...item,
                sets: item.sets.map((row, i) =>
                  i === position
                    ? { ...row, [field]: value === "" ? null : Number(value) }
                    : row,
                ),
              })
            }
          />
        </div>
      ))}
    </fieldset>
  );
}
