import type { Log } from "../../shared/api/types";
import type { TrackerEntry } from "../tracking/types";
export type DayActivity = {
  workouts: Log[];
  protein: TrackerEntry[];
  proteinTotal: number;
  weight: TrackerEntry[];
};
export function groupActivity(
  logs: Log[],
  protein: TrackerEntry[],
  weight: TrackerEntry[] = [],
) {
  const days: Record<string, DayActivity> = {};
  function day(date: string) {
    return (days[date] ??= {
      workouts: [],
      protein: [],
      proteinTotal: 0,
      weight: [],
    });
  }
  for (const log of logs) day(log.date).workouts.push(log);
  for (const entry of protein) {
    day(entry.date).protein.push(entry);
    day(entry.date).proteinTotal += entry.value;
  }
  for (const entry of weight) day(entry.date).weight.push(entry);
  return days;
}
export function monthDates(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const offset = (first.getDay() + 6) % 7;
  return { count, offset };
}
export function parseLocalDate(date: string) {
  return new Date(`${date}T12:00:00`);
}
