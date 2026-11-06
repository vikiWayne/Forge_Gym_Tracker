import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Log } from "../../shared/api/types";
import { EmptyState } from "../../shared/ui/Feedback";
export function ExerciseChart({ logs, id }: { logs: Log[]; id: string }) {
  if (!logs.length)
    return (
      <EmptyState title="A blank canvas for your progress.">
        Log a session for this exercise to see your strength story take shape.
      </EmptyState>
    );
  const points = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((log) => ({
      ...log,
      label: new Date(`${log.date}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    }));
  return (
    <>
      <div className="chart-legend">
        <span>
          <i className="legend-dot teal" />
          Heaviest set (kg)
        </span>
        <span>
          <i className="legend-dot coral" />
          Reps at that weight
        </span>
      </div>
      <div
        className="chart"
        role="img"
        aria-label="Heaviest set per workout over time. Weight in kilograms on the left axis and reps on the right axis. Exact values are available in your workout journal."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={points}
            margin={{ left: -15, right: -15, top: 10, bottom: 0 }}
          >
            <defs>
              <linearGradient id={`fill-${id}`} x1="0" y1="0" x2="0" y2="1">
                <stop stopColor="var(--chart-primary)" stopOpacity={0.22} />
                <stop
                  offset="1"
                  stopColor="var(--chart-primary)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              minTickGap={35}
            />
            <YAxis
              yAxisId="weight"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            />
            <YAxis
              yAxisId="reps"
              orientation="right"
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text)",
              }}
            />
            <Area
              yAxisId="weight"
              name="Heaviest set (kg)"
              dataKey="weight"
              type="monotone"
              fill={`url(#fill-${id})`}
              stroke="var(--chart-primary)"
              strokeWidth={3}
              isAnimationActive={false}
            />
            <Line
              yAxisId="reps"
              name="Reps"
              dataKey="reps"
              type="monotone"
              stroke="var(--chart-secondary)"
              strokeWidth={2}
              dot={{ r: 3 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
