import { dateSchema, liftWeightSchema } from "../../shared/validation.js";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
const workoutSchema = z.object({
  exercise_id: z.string().uuid(),
  sets: z
    .array(
      z.object({
        weight: liftWeightSchema,
        reps: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(50),
  date: dateSchema,
  notes: z.string().max(1000).default(""),
});
function saveSets(id, sets) {
  db.prepare("DELETE FROM log_sets WHERE log_id=?").run(id);
  const insert = db.prepare("INSERT INTO log_sets VALUES(?,?,?,?)");
  sets.forEach((set, index) => insert.run(id, index + 1, set.weight, set.reps));
}
export function workoutRoutes(app) {
  for (const method of ["post", "put"])
    app[method](
      "/api/logs" + (method === "put" ? "/:id" : ""),
      handler((req, res) => {
        const data = workoutSchema.parse(req.body);
        if (
          !db
            .prepare("SELECT id FROM exercises WHERE id=? AND user_id=?")
            .get(data.exercise_id, req.userId)
        )
          return res
            .status(400)
            .json({ error: "Choose one of your exercises." });
        if (
          method === "put" &&
          !db
            .prepare("SELECT id FROM logs WHERE id=? AND user_id=?")
            .get(req.params.id, req.userId)
        )
          return res.status(404).json({ error: "Workout not found." });
        const id = method === "post" ? randomUUID() : req.params.id;
        // Keep the heaviest set as a derived summary for progress charts.
        const best = data.sets.reduce((a, b) => (b.weight > a.weight ? b : a));
        db.exec("BEGIN");
        try {
          if (method === "post")
            db.prepare("INSERT INTO logs VALUES(?,?,?,?,?,?,?)").run(
              id,
              req.userId,
              data.exercise_id,
              best.weight,
              best.reps,
              data.date,
              data.notes,
            );
          else
            db.prepare(
              "UPDATE logs SET exercise_id=?,weight=?,reps=?,date=?,notes=? WHERE id=? AND user_id=?",
            ).run(
              data.exercise_id,
              best.weight,
              best.reps,
              data.date,
              data.notes,
              id,
              req.userId,
            );
          saveSets(id, data.sets);
          db.exec("COMMIT");
        } catch (error) {
          db.exec("ROLLBACK");
          throw error;
        }
        res.status(method === "post" ? 201 : 200).json({ id });
      }),
    );
  app.delete("/api/logs/:id", (req, res) => {
    const result = db
      .prepare("DELETE FROM logs WHERE id=? AND user_id=?")
      .run(req.params.id, req.userId);
    res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
  });
}
