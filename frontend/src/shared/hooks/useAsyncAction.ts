import { announceAction } from "../lib/actionFeedback";
import { useState } from "react";
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(
    task: () => Promise<void>,
    options: { feedback?: boolean } = {},
  ) {
    const id = crypto.randomUUID();
    if (options.feedback !== false) announceAction({ id, phase: "pending" });
    setPending(true);
    setError("");
    try {
      await task();
      if (options.feedback !== false) announceAction({ id, phase: "success" });
    } catch (cause) {
      if (options.feedback !== false) announceAction({ id, phase: "error" });
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
