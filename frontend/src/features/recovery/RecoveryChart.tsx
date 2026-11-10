import {
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMotionPreference } from "../../shared/hooks/useMotionPreference";
import { EmptyState } from "../../shared/ui/Feedback";
import { formatDate } from "../../shared/lib/dates";
import type { RecoveryEntry } from "./types";
export function RecoveryChart({ entries }: { entries: RecoveryEntry[] }) {
  const motion = useMotionPreference();
  const data = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-30);
  if (!data.length)
    return (
      <EmptyState title="A little context for your training.">
        Log your sleep and how you feel. Your recent trends will appear here.
      </EmptyState>
    );
  return (
    <>
      <div className="recovery-legend">
        <span>Sleep · hours (left)</span>
        <span>Energy, soreness, mood · 1–5 (right)</span>
      </div>
      <div
        className="chart recovery-chart"
        role="img"
        aria-label="Last 30 logged days of sleep in hours and energy, soreness and mood ratings. Exact values appear in the timeline below."
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ left: -15, right: -15, top: 10 }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              minTickGap={45}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              tickFormatter={(date) => formatDate(String(date))}
            />
            <YAxis
              yAxisId="sleep"
              domain={[0, "auto"]}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <YAxis
              yAxisId="ratings"
              orientation="right"
              domain={[1, 5]}
              allowDecimals={false}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <Tooltip
              labelFormatter={(date) => formatDate(String(date))}
              contentStyle={{
                background: "var(--surface)",
                color: "var(--text)",
                border: "1px solid var(--border)",
                borderRadius: 12,
              }}
            />
            <Line
              yAxisId="sleep"
              dataKey="sleep_hours"
              name="Sleep (hours)"
              stroke="var(--chart-primary)"
              strokeWidth={3}
              isAnimationActive={motion}
            />
            <Line
              yAxisId="ratings"
              dataKey="energy"
              name="Energy (1–5)"
              stroke="var(--chart-secondary)"
              strokeDasharray="5 3"
              isAnimationActive={motion}
            />
            <Line
              yAxisId="ratings"
              dataKey="soreness"
              name="Soreness (1–5)"
              stroke="var(--chart-third)"
              strokeDasharray="2 3"
              isAnimationActive={motion}
            />
            <Line
              yAxisId="ratings"
              dataKey="mood"
              name="Mood (1–5)"
              stroke="var(--text)"
              strokeDasharray="8 3 2 3"
              isAnimationActive={motion}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
