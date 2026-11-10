import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Check, Target } from "lucide-react";
import { api } from "../../shared/api/client";
import { useAsyncAction } from "../../shared/hooks/useAsyncAction";
import { PageHeader } from "../../shared/ui/PageHeader";
import { ErrorMessage, LoadingState } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import "./goals.css";

type WeeklyGoal = {
  target: number | null;
  completed: number;
  dates: string[];
  week: { today: string; start: string; end: string };
};
export function WeeklyGoalsPage() {
  const [data, setData] = useState<WeeklyGoal | null>(null);
  const [target, setTarget] = useState("3");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const action = useAsyncAction();
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api<WeeklyGoal>("/goals/weekly");
      setData(result);
      setTarget(String(result.target ?? 3));
      setLoadError("");
    } catch (cause) {
      setLoadError(
        cause instanceof Error
          ? cause.message
          : "Your goal could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void action.run(async () => {
      setData(
        await api<WeeklyGoal>("/goals/weekly", "PUT", {
          target: Number(target),
        }),
      );
    });
  }
  const remaining = data?.target
    ? Math.max(0, data.target - data.completed)
    : 0;
  return (
    <>
      <PageHeader
        eyebrow="A RHYTHM THAT WORKS FOR YOU"
        title="Your weekly training goal."
        description="Choose how many days you want to train each week. Rest days belong in your plan, too."
      />
      <ErrorMessage message={loadError || action.error} />
      {loading ? (
        <LoadingState />
      ) : loadError ? (
        <button className="button secondary" onClick={() => void load()}>
          Try again
        </button>
      ) : (
        data && (
          <div className="weekly-goals-layout">
            <section
              className="panel weekly-goal-progress"
              aria-labelledby="weekly-goal-heading"
            >
              <span className="panel-icon">
                <Target size={24} />
              </span>
              <h2 id="weekly-goal-heading">
                {data.target
                  ? "This week, at your pace"
                  : "Give your week a little direction"}
              </h2>
              <p>
                {formatDate(data.week.start)} – {formatDate(data.week.end)}
              </p>
              <div className="weekly-goal-total">
                <strong>{data.completed}</strong>
                <span>
                  {data.target
                    ? `of ${data.target} training days`
                    : "training days logged"}
                </span>
              </div>
              {data.target && (
                <>
                  <progress
                    value={Math.min(data.completed, data.target)}
                    max={data.target}
                    aria-label={`${data.completed} of ${data.target} weekly training days completed`}
                  />
                  <p className="weekly-goal-message" role="status">
                    {remaining === 0
                      ? "Weekly goal reached. Enjoy your progress and recover well."
                      : `${remaining} more training ${remaining === 1 ? "day" : "days"} to reach your goal.`}
                  </p>
                </>
              )}
              <div
                className="weekly-goal-days"
                aria-label="Training days this week"
              >
                {Array.from({ length: 7 }, (_, index) => {
                  const date = new Date(`${data.week.start}T12:00:00Z`);
                  date.setUTCDate(date.getUTCDate() + index);
                  const iso = date.toISOString().slice(0, 10),
                    hit = data.dates.includes(iso);
                  return (
                    <div
                      className={hit ? "goal-day goal-day-done" : "goal-day"}
                      key={iso}
                      aria-label={`${formatDate(iso)}: ${hit ? "workout logged" : iso > data.week.today ? "upcoming" : "no workout logged"}`}
                    >
                      <span>
                        {date.toLocaleDateString(undefined, {
                          weekday: "short",
                          timeZone: "UTC",
                        })}
                      </span>
                      <strong>
                        {hit ? <Check size={18} /> : date.getUTCDate()}
                      </strong>
                    </div>
                  );
                })}
              </div>
              <p className="field-hint">
                Monday–Sunday in India time. Multiple exercise logs on one date
                count as one training day. Rest days do not reset your weekly
                progress.
              </p>
            </section>
            <section className="panel weekly-goal-settings">
              <h2>
                {data.target ? "Adjust your goal" : "Set your first goal"}
              </h2>
              <p>
                Pick a realistic weekly rhythm. Your saved workout history
                always stays the same when you change a target.
              </p>
              <form onSubmit={submit}>
                <label>
                  Training days per week
                  <select
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                  >
                    {Array.from({ length: 7 }, (_, index) => (
                      <option value={index + 1} key={index}>
                        {index + 1} {index === 0 ? "day" : "days"}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  className="button primary full-width"
                  disabled={action.pending}
                >
                  {action.pending ? "Saving…" : "Save weekly goal"}
                </button>
              </form>
              {data.target && (
                <button
                  className="button subtle full-width weekly-goal-remove"
                  disabled={action.pending}
                  onClick={() =>
                    void action.run(async () => {
                      setData(await api<WeeklyGoal>("/goals/weekly", "DELETE"));
                    })
                  }
                >
                  Remove weekly target
                </button>
              )}
              <p className="field-hint">
                This is a flexible goal, not a required streak. Choose recovery
                whenever you need it.
              </p>
            </section>
          </div>
        )
      )}
    </>
  );
}
