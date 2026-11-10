import type { TrainingSession } from "../../shared/api/types";
export function clockText(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
export function RestTimer({
  session,
  now,
  onChange,
  disabled,
}: {
  session: TrainingSession;
  now: number;
  onChange: (patch: Partial<TrainingSession>) => void;
  disabled: boolean;
}) {
  const remaining = session.rest_until
    ? Math.max(0, Math.ceil((session.rest_until - now) / 1000))
    : null;
  return (
    <section className="panel rest-timer" aria-label="Rest timer">
      <div>
        <span className="section-kicker">REST TIMER</span>
        <strong className="timer-digits">
          {clockText(remaining ?? session.rest_seconds)}
        </strong>
        <p role="status">
          {remaining === 0
            ? "Rest complete. Ready for your next set."
            : remaining === null
              ? "Checking a set starts your rest timer."
              : "Take a breather."}
        </p>
      </div>
      <div className="timer-controls">
        <label>
          Rest between sets
          <select
            disabled={disabled}
            value={session.rest_seconds}
            onChange={(event) =>
              onChange({ rest_seconds: Number(event.target.value) })
            }
          >
            {[30, 60, 90, 120, 180, 300].map((seconds) => (
              <option key={seconds} value={seconds}>
                {clockText(seconds)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button secondary"
          disabled={disabled}
          onClick={() =>
            onChange({ rest_until: Date.now() + session.rest_seconds * 1000 })
          }
        >
          {remaining === null ? "Start timer" : "Restart timer"}
        </button>
        {remaining !== null && (
          <button
            type="button"
            className="button subtle"
            disabled={disabled}
            onClick={() => onChange({ rest_until: null })}
          >
            Skip rest
          </button>
        )}
      </div>
    </section>
  );
}
