import { useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  Legend,
} from "recharts";
import type { Plan } from "../../shared/api/types";
import { EmptyState } from "../../shared/ui/Feedback";
export function SharedProgressChart({ plan }: { plan: Plan }) {
  const names = Array.from(new Set(plan.logs.map((log) => log.name || "")));
  const [name, setName] = useState("");
  const selectedName = names.includes(name) ? name : names[0];
  if (!plan.logs.length)
    return (
      <EmptyState title="A fresh start for your crew.">
        Your shared charts will appear when accepted members log their workouts.
      </EmptyState>
    );
  const data = Object.values(
    plan.logs
      .filter((log) => log.name === selectedName)
      .reduce<Record<string, Record<string, string | number>>>(
        (points, log) => {
          points[log.date] ??= { date: log.date };
          // Compare the heaviest set for each member on a given day.
          const weightKey = `${log.user_id || log.username}-weight`;
          if (
            points[log.date][weightKey] === undefined ||
            log.weight > Number(points[log.date][weightKey])
          ) {
            points[log.date][weightKey] = log.weight;
            points[log.date][`${log.user_id || log.username}-reps`] = log.reps;
          }
          return points;
        },
        {},
      ),
  ).sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return (
    <>
      <div className="shared-chart-toolbar">
        <label className="inline-label">
          Compare movement
          <select
            value={selectedName || ""}
            onChange={(event) => setName(event.target.value)}
          >
            {names.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <p>Heaviest set per person, per day.</p>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: -15, right: -15 }}>
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
              minTickGap={35}
            />
            <YAxis
              yAxisId="weight"
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            />
            <YAxis
              yAxisId="reps"
              orientation="right"
              allowDecimals={false}
              tick={{ fill: "var(--text-muted)", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                color: "var(--text)",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {plan.members.flatMap((member, index) => [
              <Line
                key={`${member.id}-weight`}
                yAxisId="weight"
                dataKey={`${member.id}-weight`}
                name={`${member.username} · kg`}
                stroke={
                  [
                    "var(--chart-primary)",
                    "var(--chart-secondary)",
                    "var(--chart-third)",
                  ][index % 3]
                }
                connectNulls
                isAnimationActive={false}
              />,
              <Line
                key={`${member.id}-reps`}
                yAxisId="reps"
                dataKey={`${member.id}-reps`}
                name={`${member.username} · reps`}
                stroke={
                  [
                    "var(--chart-primary)",
                    "var(--chart-secondary)",
                    "var(--chart-third)",
                  ][index % 3]
                }
                strokeDasharray="4 4"
                connectNulls
                isAnimationActive={false}
              />,
            ])}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}
