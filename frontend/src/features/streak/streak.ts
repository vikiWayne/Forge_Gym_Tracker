const DAY = 86400000;
function dayNumber(date: string) {
  return Date.parse(date + "T00:00:00Z") / DAY;
}
/** Multiple exercises on one date count once. Today stays open until midnight. */
export function workoutStreak(dates: string[], today: string) {
  const end = dayNumber(today);
  const days = [...new Set(dates.map(dayNumber))]
    .filter((day) => Number.isFinite(day) && day <= end)
    .sort((a, b) => a - b);
  const logged = new Set(days);
  let best = 0,
    run = 0,
    previous = -Infinity;
  for (const day of days) {
    run = day === previous + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }
  let cursor = logged.has(end) ? end : end - 1;
  let current = 0;
  while (logged.has(cursor--)) current++;
  return { current, best, loggedToday: logged.has(end), days: logged };
}
