import { useState } from "react";
export function useAsyncAction() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function run(task: () => Promise<void>) {
    setPending(true);
    setError("");
    try {
      await task();
    } catch (cause) {
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
