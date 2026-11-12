import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";

const noteSchema = z.string().trim().max(500).default("");
export async function alternativesRoutes(app) {
  await db.exec(`CREATE TABLE IF NOT EXISTS exercise_alternatives(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
    exercise_a TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    exercise_b TEXT NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    note TEXT NOT NULL DEFAULT '',UNIQUE(user_id,exercise_a,exercise_b),
    CHECK(exercise_a<>exercise_b));
    CREATE INDEX IF NOT EXISTS alternatives_user ON exercise_alternatives(user_id);`);
  app.get(
    "/api/alternatives",
    handler(async (req, res) => {
      const exerciseId =
        req.query.exercise_id === undefined
          ? null
          : z.string().uuid().parse(req.query.exercise_id);
      const rows = await db
        .prepare(
          `SELECT a.id,a.exercise_a,a.exercise_b,a.note,
      x.name AS name_a,y.name AS name_b,x.category AS category_a,y.category AS category_b
      FROM exercise_alternatives a JOIN exercises x ON x.id=a.exercise_a
      JOIN exercises y ON y.id=a.exercise_b WHERE a.user_id=? ORDER BY x.name,y.name`,
        )
        .all(req.userId);
      res.set("Cache-Control", "no-store").json({
        alternatives: exerciseId
          ? rows.filter(
              (row) =>
                row.exercise_a === exerciseId || row.exercise_b === exerciseId,
            )
          : rows,
      });
    }),
  );
  app.post(
    "/api/alternatives",
    handler(async (req, res) => {
      const data = z
        .object({
          exercise_a: z.string().uuid(),
          exercise_b: z.string().uuid(),
          note: noteSchema,
        })
        .parse(req.body);
      if (data.exercise_a === data.exercise_b)
        return res
          .status(400)
          .json({ error: "Choose two different exercises." });
      const owned = db.prepare(
        "SELECT id FROM exercises WHERE id=? AND user_id=?",
      );
      if (
        !(await owned.get(data.exercise_a, req.userId)) ||
        !(await owned.get(data.exercise_b, req.userId))
      )
        return res
          .status(400)
          .json({ error: "Choose exercises from your own library." });
      const [first, second] = [data.exercise_a, data.exercise_b].sort();
      if (
        await db
          .prepare(
            "SELECT id FROM exercise_alternatives WHERE user_id=? AND exercise_a=? AND exercise_b=?",
          )
          .get(req.userId, first, second)
      )
        return res.status(409).json({
          error: "These exercises are already linked in both directions.",
        });
      const id = randomUUID();
      await db
        .prepare(
          "INSERT INTO exercise_alternatives(id,user_id,exercise_a,exercise_b,note) VALUES(?,?,?,?,?)",
        )
        .run(id, req.userId, first, second, data.note);
      res.status(201).json({ id });
    }),
  );
  app.patch(
    "/api/alternatives/:id",
    handler(async (req, res) => {
      const { note } = z.object({ note: noteSchema }).parse(req.body);
      const result = await db
        .prepare(
          "UPDATE exercise_alternatives SET note=? WHERE id=? AND user_id=?",
        )
        .run(note, req.params.id, req.userId);
      res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
    }),
  );
  app.delete(
    "/api/alternatives/:id",
    handler(async (req, res) => {
      const result = await db
        .prepare("DELETE FROM exercise_alternatives WHERE id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
    }),
  );
}
