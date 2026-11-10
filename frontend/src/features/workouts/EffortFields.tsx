import "./effort.css";
export function EffortFields({
  label,
  rpe,
  rir,
  disabled = false,
  onChange,
}: {
  label: string;
  rpe: string;
  rir: string;
  disabled?: boolean;
  onChange: (field: "rpe" | "rir", value: string) => void;
}) {
  return (
    <div className="set-effort-fields">
      <label>
        RPE <span className="optional">optional</span>
        <input
          aria-label={`${label} RPE`}
          type="number"
          min={1}
          max={10}
          step="0.5"
          placeholder="1–10"
          value={rpe}
          disabled={disabled}
          onChange={(event) => onChange("rpe", event.target.value)}
        />
      </label>
      <label>
        Reps in reserve <span className="optional">optional</span>
        <input
          aria-label={`${label} reps in reserve`}
          type="number"
          min={0}
          max={10}
          step={1}
          placeholder="0–10"
          value={rir}
          disabled={disabled}
          onChange={(event) => onChange("rir", event.target.value)}
        />
      </label>
    </div>
  );
}
