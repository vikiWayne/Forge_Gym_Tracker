import { Smartphone } from "lucide-react";
import type { TrainingSession } from "../../shared/api/types";
import { useNativeWorkout } from "./NativeWorkoutProvider";
import { isNative } from "./bridge";
import "./native.css";

export function LockScreenControl({ session }: { session: TrainingSession }) {
  const state = useNativeWorkout();
  if (!isNative()) return null;
  return (
    <section
      className="panel lock-screen-control"
      aria-label="Lock-screen workout"
    >
      <div>
        <h2>
          <Smartphone size={18} aria-hidden="true" /> Workout at a glance
        </h2>
        <p>
          {state.enabled
            ? "Your timer and sets are on the lock screen. Tap the card to return here."
            : "Show this workout’s name, next exercise and set count while your phone is locked."}
        </p>
        <p className="field-hint">
          Optional. Visible to anyone viewing your lock screen. Rest alerts may
          be delayed by your phone.
        </p>
      </div>
      <button
        type="button"
        className="button secondary"
        disabled={state.busy}
        onClick={() =>
          state.enabled ? state.stop() : void state.enable(session)
        }
      >
        {state.busy
          ? "Enabling…"
          : state.enabled
            ? "Hide from lock screen"
            : "Show on lock screen"}
      </button>
      {state.error && (
        <p role="status" className="field-hint">
          {state.error}
        </p>
      )}
    </section>
  );
}
