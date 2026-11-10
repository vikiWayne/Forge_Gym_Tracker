import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Target } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { ErrorMessage } from "../../shared/ui/Feedback";
import type { TrackerEntry } from "../tracking/types";
import "./nutrition.css";

type Summary = {
  date: string;
  target: number | null;
  logged: number;
  remaining: number | null;
};
const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function NutritionTarget({ entries }: { entries: TrackerEntry[] }) {
  const [data, setData] = useState<Summary | null>(null);
  const [target, setTarget] = useState("");
  const [date, setDate] = useState(today);
  const [error, setError] = useState("");
  const action = useAsyncAction();
  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const result = await api<Summary>(
        "/nutrition/target",
        "GET",
        undefined,
        signal,
      );
      if (signal?.aborted) return;
      setData(result);
      setTarget(result.target === null ? "" : String(result.target));
      setError("");
    } catch (cause) {
      if (!signal?.aborted)
        setError(
          cause instanceof Error
            ? cause.message
            : "Your protein target could not be loaded.",
        );
    }
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load, entries, date]);
  useEffect(() => {
    const timer = window.setInterval(() => setDate(today()), 30000);
    return () => window.clearInterval(timer);
  }, []);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action.run(async () => {
      setData(
        await api<Summary>("/nutrition/target", "PUT", {
          target: Number(target),
        }),
      );
      setError("");
    });
  }
  return (
    <section
      className="panel nutrition-target"
      aria-labelledby="protein-target-heading"
    >
      <div className="nutrition-target-progress">
        <span className="section-kicker">
          <Target size={16} />
          YOUR DAILY FUEL
        </span>
        <h2 id="protein-target-heading">Today’s protein</h2>
        {data ? (
          <>
            <p className="nutrition-target-total">
              <strong>{data.logged.toFixed(2)} g</strong>
              {data.target !== null && (
                <span> of {data.target.toFixed(2)} g</span>
              )}
            </p>
            {data.target !== null ? (
              <>
                <progress
                  max={data.target}
                  value={Math.min(data.logged, data.target)}
                  aria-label={`${data.logged} of ${data.target} grams protein logged today`}
                />
                <p role="status">
                  {data.remaining === 0
                    ? "Target reached. Nice work."
                    : `${data.remaining?.toFixed(2)} g left to your target today.`}
                </p>
              </>
            ) : (
              <p>
                No target set. Your protein journal works with or without one.
              </p>
            )}
          </>
        ) : (
          !error && <p role="status">Loading your target…</p>
        )}
        <p className="field-hint">
          Today in India time · Saved entries only. You choose your target.
        </p>
      </div>
      <details className="nutrition-target-settings" open={!data?.target}>
        <summary>
          {data?.target ? "Edit daily target" : "Set a daily target"}
        </summary>
        <form onSubmit={submit}>
          <label>
            Daily protein target (g)
            <input
              name="protein_target"
              type="number"
              min={1}
              max={1000}
              step="0.01"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              required
              placeholder="Choose your target"
            />
          </label>
          <ErrorMessage message={error || action.error} />
          <div className="nutrition-target-actions">
            <button
              className="button primary"
              disabled={action.pending || !data}
            >
              {action.pending ? "Saving…" : "Save target"}
            </button>
            {data?.target !== null && data && (
              <button
                type="button"
                className="button subtle"
                disabled={action.pending}
                onClick={() =>
                  void action.run(async () => {
                    setData(await api<Summary>("/nutrition/target", "DELETE"));
                    setTarget("");
                    setError("");
                  })
                }
              >
                Remove target
              </button>
            )}
            {error && (
              <button
                type="button"
                className="button secondary"
                onClick={() => void load()}
              >
                Try again
              </button>
            )}
          </div>
        </form>
      </details>
    </section>
  );
}
