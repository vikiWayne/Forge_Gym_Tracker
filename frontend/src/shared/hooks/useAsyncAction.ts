import { announceAction } from "../lib/actionFeedback";
import { useState } from "react";
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(task: () => Promise<void>) {
    const id = crypto.randomUUID();
    announceAction({ id, phase: "pending" });
    setPending(true);
    setError("");
    try {
      await task();
      announceAction({ id, phase: "success" });
    } catch (cause) {
      announceAction({ id, phase: "error" });
      setError(
        cause instanceof Error
          ? cause.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }
  return { pending, error, run, clearError: () => setError("") };
}
