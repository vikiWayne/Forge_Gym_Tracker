import type { Log } from "../../shared/api/types";
export function journeyProgress(logs: Log[], today: string) {
  const seen = new Set<string>();
  const saved = logs.filter((log) => {
    const date = new Date(log.date + "T12:00:00Z");
    if (
      seen.has(log.id) ||
      log.pending_sync ||
      log.date > today ||
      !/^\d{4}-\d{2}-\d{2}$/.test(log.date) ||
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== log.date
    )
      return false;
    seen.add(log.id);
    return true;
  });
  const sets = saved.reduce((sum, log) => sum + log.sets.length, 0);
  const days = new Set(saved.map((log) => log.date)).size;
  const xp = sets * 10 + days * 25;
  const level = Math.floor(xp / 250) + 1;
  const milestones = [
    {
      id: "first",
      title: "First rep",
      detail: "Save your first workout",
      value: saved.length,
      target: 1,
    },
    {
      id: "ten",
      title: "Finding rhythm",
      detail: "Complete 10 sets",
      value: sets,
      target: 10,
    },
    {
      id: "days",
      title: "Showing up",
      detail: "Train on 3 different days",
      value: days,
      target: 3,
    },
    {
      id: "fifty",
      title: "Built with effort",
      detail: "Complete 50 sets",
      value: sets,
      target: 50,
    },
    {
      id: "week",
      title: "Your own pace",
      detail: "Train on 7 different days",
      value: days,
      target: 7,
    },
    {
      id: "hundred",
      title: "The long game",
      detail: "Complete 100 sets",
      value: sets,
      target: 100,
    },
  ].map((item) => ({ ...item, earned: item.value >= item.target }));
  return {
    xp,
    level,
    progress: xp % 250,
    remaining: 250 - (xp % 250),
    sets,
    days,
    workouts: saved.length,
    milestones,
  };
}
