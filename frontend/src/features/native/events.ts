import type { TrainingSession } from "../../shared/api/types";
export const WORKOUT_CHANGED = "forge:native-workout";
export function publishWorkout(session: TrainingSession | null) {
  window.dispatchEvent(new CustomEvent(WORKOUT_CHANGED, { detail: session }));
}
export function pauseLockScreen() {
  window.dispatchEvent(new Event("forge:pause-lock-screen"));
}
