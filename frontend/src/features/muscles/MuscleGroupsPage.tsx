import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "../../shared/ui/PageHeader";
import {
  ErrorMessage,
  LoadingState,
  EmptyState,
} from "../../shared/ui/Feedback";
import { api } from "../../shared/api/client";
import { formatDate } from "../../shared/lib/dates";
import { MuscleTagEditor } from "./MuscleTagEditor";
import type { MuscleData } from "./types";
import "./muscles.css";
export function MuscleGroupsPage() {
  const [data, setData] = useState<MuscleData | null>(null);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await api<MuscleData>("/muscles"));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Your muscle tracking could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const exercise =
    data?.exercises.find((item) => item.id === selected) || data?.exercises[0];
  const max = Math.max(1, ...(data?.summary.map((item) => item.sets) || []));
  return (
    <>
      <PageHeader
        eyebrow="A LITTLE BALANCE, A CLEARER PICTURE"
        title="Your weekly muscle groups."
        description="Tag the muscles you train, then review how your saved sets are distributed."
      />
      <ErrorMessage message={error} />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <button className="button secondary" onClick={() => void load()}>
          Try again
        </button>
      ) : (
        data && (
          <>
            <section className="panel muscle-week">
              <div className="section-head">
                <div>
                  <h2>Sets by muscle group</h2>
                  <p>
                    {formatDate(data.week.start)} – {formatDate(data.week.end)}
                  </p>
                </div>
                <button
                  className="button secondary"
                  onClick={() => void load()}
                >
                  Refresh totals
                </button>
              </div>
              <p className="field-hint muscle-explanation">
                Monday–Sunday in India time. Only saved sets through today are
                counted. Each set counts once in every tagged muscle group, so
                these totals can overlap. Tags describe your own exercise
                choices; they do not measure muscle activation.
              </p>
              <div
                className="muscle-totals"
                role="list"
                aria-label="Saved sets by muscle group this week"
              >
                {data.summary.map((item) => (
                  <div
                    className="muscle-total"
                    role="listitem"
                    key={item.muscle}
                  >
                    <div>
                      <span>{item.muscle}</span>
                      <strong>{item.sets} sets</strong>
                    </div>
                    <div className="muscle-bar" aria-hidden="true">
                      <span style={{ width: `${(item.sets / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="muscle-untagged">
                <strong>{data.untagged_sets}</strong> saved sets this week
                belong to exercises without muscle tags.
              </p>
            </section>
            <section className="panel muscle-editor">
              <h2>Give each movement its muscle tags</h2>
              {exercise ? (
                <>
                  <label>
                    Exercise
                    <select
                      value={exercise.id}
                      onChange={(event) => setSelected(event.target.value)}
                    >
                      {data.exercises.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} · {item.category}
                        </option>
                      ))}
                    </select>
                  </label>
                  <MuscleTagEditor
                    key={exercise.id}
                    exercise={exercise}
                    groups={data.groups}
                    onSaved={setData}
                  />
                  <Link
                    className="text-link muscle-library-link"
                    to="/exercises"
                  >
                    Open your exercise library →
                  </Link>
                </>
              ) : (
                <EmptyState
                  title="Start with your movement library."
                  to="/exercises"
                  action="Add an exercise"
                >
                  Add your own exercises, then choose the muscles you want to
                  track.
                </EmptyState>
              )}
            </section>
          </>
        )
      )}
    </>
  );
}
