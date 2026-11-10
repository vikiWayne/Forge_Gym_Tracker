import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMotionPreference } from "../../shared/hooks/useMotionPreference";
import { EmptyState } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import type { Measurement } from "./types";

export function MeasurementChart({ entries }: { entries: Measurement[] }) {
  const motion = useMotionPreference();
  // The API orders same-date entries newest first; retain the latest per day.
  const days = new Map<string, number>();
  for (const entry of entries)
    if (!days.has(entry.date)) days.set(entry.date, entry.value);
  const points = [...days]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
  if (!points.length)
    return (
      <EmptyState title="A measurement, a moment in your story.">
        Log this area to start its graph. Only your saved measurements appear
        here.
      </EmptyState>
    );
  return (
    <div
      className="chart measurement-chart"
      role="img"
      aria-label="Measurements in centimeters over time, using the latest saved entry per day. Exact values appear in the history below."
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={points}
          margin={{ left: -10, right: 15, top: 15, bottom: 0 }}
        >
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={40}
            tickFormatter={formatDate}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={["auto", "auto"]}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 10,
            }}
            labelFormatter={(date) => formatDate(String(date))}
            formatter={(value) => [
              `${Number(value).toFixed(2)} cm`,
              "Measurement",
            ]}
          />
          <Line
            dataKey="value"
            type="monotone"
            stroke="var(--chart-primary)"
            strokeWidth={3}
            dot={{ r: 4 }}
            isAnimationActive={motion}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
