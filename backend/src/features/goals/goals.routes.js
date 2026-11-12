import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";

export function goalWeek(today = indiaDate()) {
  const date = new Date(`${today}T12:00:00Z`);
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    today,
    start: monday.toISOString().slice(0, 10),
    end: sunday.toISOString().slice(0, 10),
  };
}
function indiaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export async function goalsRoutes(app) {
  await db.exec(`CREATE TABLE IF NOT EXISTS weekly_goals(
    user_id TEXT PRIMARY KEY REFERENCES users(id),
    target INTEGER NOT NULL CHECK(target BETWEEN 1 AND 7)
  )`);
  async function summary(userId) {
    const week = goalWeek();
    const target =
      (
        await db
          .prepare("SELECT target FROM weekly_goals WHERE user_id=?")
          .get(userId)
      )?.target ?? null;
    const dates = (
      await db
        .prepare(
          "SELECT DISTINCT date FROM logs WHERE user_id=? AND date>=? AND date<=? ORDER BY date",
        )
        .all(userId, week.start, week.today)
    ).map((row) => row.date);
    return { target, completed: dates.length, dates, week };
  }
  app.get(
    "/api/goals/weekly",
    handler(async (req, res) => {
      res.set("Cache-Control", "no-store").json(await summary(req.userId));
    }),
  );
  app.put(
    "/api/goals/weekly",
    handler(async (req, res) => {
      const { target } = z
        .object({ target: z.number().int().min(1).max(7) })
        .parse(req.body);
      await db
        .prepare(
          "INSERT INTO weekly_goals(user_id,target) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET target=excluded.target",
        )
        .run(req.userId, target);
      res.json(await summary(req.userId));
    }),
  );
  app.delete(
    "/api/goals/weekly",
    handler(async (req, res) => {
      await db
        .prepare("DELETE FROM weekly_goals WHERE user_id=?")
        .run(req.userId);
      res.json(await summary(req.userId));
    }),
  );
}
