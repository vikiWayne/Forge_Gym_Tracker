import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMotionPreference } from "../../shared/hooks/useMotionPreference";
import { EmptyState } from "../../shared/ui/Feedback";
import { trackerConfig, type TrackerEntry, type TrackerKind } from "./types";
export function TrackerChart({
  kind,
  entries,
}: {
  kind: TrackerKind;
  entries: TrackerEntry[];
}) {
  const motion = useMotionPreference();
  const days = entries.reduce<Record<string, number>>((result, entry) => {
    if (kind === "protein")
      result[entry.date] = (result[entry.date] || 0) + entry.value;
    else if (result[entry.date] === undefined) result[entry.date] = entry.value;
    return result;
  }, {});
  const data = Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value: Number(value.toFixed(2)) }));
  if (!data.length)
    return (
      <EmptyState title="A little consistency makes a picture.">
        Your graph will appear after your first entry. Every point will come
        from your own logs.
      </EmptyState>
    );
  return (
    <div
      className="chart tracker-chart"
      role="img"
      aria-label={
        kind === "protein"
          ? "Daily total protein in grams. Exact entries are in the table below."
          : "Body weight in kilograms over time, using the latest weigh-in per day. Exact entries are in the table below."
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ left: -8, right: 12, top: 10, bottom: 0 }}
        >
          <defs>
            <linearGradient id={`tracker-${kind}`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor="var(--chart-primary)" stopOpacity={0.25} />
              <stop
                offset="1"
                stopColor="var(--chart-primary)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            minTickGap={35}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            tickFormatter={(date) =>
              new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            }
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={kind === "protein" ? [0, "auto"] : ["auto", "auto"]}
            tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              color: "var(--text)",
              border: "1px solid var(--border)",
              borderRadius: 12,
            }}
            formatter={(value) => [
              `${Number(value).toFixed(2)} ${trackerConfig[kind].unit}`,
              kind === "protein" ? "Daily protein" : "Body weight",
            ]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="var(--chart-primary)"
            strokeWidth={3}
            fill={`url(#tracker-${kind})`}
            dot={{ r: 4 }}
            isAnimationActive={motion}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
