import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { goalWeek } from "../goals/goals.routes.js";

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Core",
  "Hip adductors",
  "Hip abductors",
];
export async function musclesRoutes(app) {
  await db.exec(`CREATE TABLE IF NOT EXISTS exercise_muscles(
    exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    muscle TEXT NOT NULL,PRIMARY KEY(exercise_id,muscle));`);
  async function summary(userId) {
    const week = goalWeek();
    const counts = await db
      .prepare(
        `SELECT m.muscle,COUNT(*) AS sets FROM logs l
      JOIN log_sets s ON s.log_id=l.id JOIN exercise_muscles m ON m.exercise_id=l.exercise_id
      WHERE l.user_id=? AND l.date>=? AND l.date<=? GROUP BY m.muscle`,
      )
      .all(userId, week.start, week.today);
    const untagged = (
      await db
        .prepare(
          `SELECT COUNT(*) AS sets FROM logs l JOIN log_sets s ON s.log_id=l.id
      WHERE l.user_id=? AND l.date>=? AND l.date<=? AND NOT EXISTS(
        SELECT 1 FROM exercise_muscles m WHERE m.exercise_id=l.exercise_id)`,
        )
        .get(userId, week.start, week.today)
    ).sets;
    const tags = await db
      .prepare(
        `SELECT m.exercise_id,m.muscle FROM exercise_muscles m
      JOIN exercises e ON e.id=m.exercise_id WHERE e.user_id=? ORDER BY m.muscle`,
      )
      .all(userId);
    const exercises = (
      await db
        .prepare(
          "SELECT id,name,category FROM exercises WHERE user_id=? ORDER BY name",
        )
        .all(userId)
    ).map((exercise) => ({
      ...exercise,
      muscles: tags
        .filter((tag) => tag.exercise_id === exercise.id)
        .map((tag) => tag.muscle),
    }));
    return {
      groups: MUSCLE_GROUPS,
      week,
      exercises,
      summary: MUSCLE_GROUPS.map((muscle) => ({
        muscle,
        sets: counts.find((row) => row.muscle === muscle)?.sets || 0,
      })),
      untagged_sets: untagged,
    };
  }
  app.get(
    "/api/muscles",
    handler(async (req, res) =>
      res.set("Cache-Control", "no-store").json(await summary(req.userId)),
    ),
  );
  app.put(
    "/api/muscles/exercises/:id",
    handler(async (req, res) => {
      const data = z
        .object({
          muscles: z.array(z.enum(MUSCLE_GROUPS)).max(MUSCLE_GROUPS.length),
        })
        .parse(req.body);
      if (
        !(await db
          .prepare("SELECT id FROM exercises WHERE id=? AND user_id=?")
          .get(req.params.id, req.userId))
      )
        return res.status(404).json({ error: "Exercise not found." });
      await db.transaction(async () => {
        await db
          .prepare("DELETE FROM exercise_muscles WHERE exercise_id=?")
          .run(req.params.id);
        const insert = db.prepare(
          "INSERT INTO exercise_muscles(exercise_id,muscle) VALUES(?,?)",
        );
        for (const muscle of new Set(data.muscles))
          await insert.run(req.params.id, muscle);
      });
      res.json(await summary(req.userId));
    }),
  );
}
