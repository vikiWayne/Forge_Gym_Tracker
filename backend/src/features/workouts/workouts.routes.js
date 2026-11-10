import { dateSchema, liftWeightSchema } from "../../shared/validation.js";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { effortFields } from "./effort.js";
const workoutSchema = z.object({
  client_id: z.string().uuid().optional(),
  exercise_id: z.string().uuid(),
  sets: z
    .array(
      z.object({
        weight: liftWeightSchema,
        reps: z.number().int().min(1).max(1000),
        ...effortFields,
      }),
    )
    .min(1)
    .max(50),
  date: dateSchema,
  notes: z.string().max(1000).default(""),
});
function saveSets(id, sets) {
  db.prepare("DELETE FROM log_sets WHERE log_id=?").run(id);
  const insert = db.prepare(
    "INSERT INTO log_sets(log_id,position,weight,reps,rpe,rir) VALUES(?,?,?,?,?,?)",
  );
  sets.forEach((set, index) =>
    insert.run(
      id,
      index + 1,
      set.weight,
      set.reps,
      set.rpe ?? null,
      set.rir ?? null,
    ),
  );
}
export function workoutRoutes(app) {
  db.exec(
    "CREATE TABLE IF NOT EXISTS offline_workout_receipts(user_id TEXT NOT NULL REFERENCES users(id),client_id TEXT NOT NULL,digest TEXT NOT NULL,log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,client_id))",
  );
  for (const method of ["post", "put"])
    app[method](
      "/api/logs" + (method === "put" ? "/:id" : ""),
      handler((req, res) => {
        const data = workoutSchema.parse(req.body);
        const digest = createHash("sha256")
          .update(JSON.stringify(data))
          .digest("hex");
        if (method === "post" && data.client_id) {
          const receipt = db
            .prepare(
              "SELECT digest,log_id FROM offline_workout_receipts WHERE user_id=? AND client_id=?",
            )
            .get(req.userId, data.client_id);
          if (receipt) {
            if (receipt.digest !== digest)
              return res.status(409).json({
                error:
                  "This saved offline workout has different content. Resolve it before retrying.",
              });
            return res.json({ id: receipt.log_id });
          }
        }
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
          if (method === "post" && data.client_id)
            db.prepare(
              "INSERT INTO offline_workout_receipts(user_id,client_id,digest,log_id) VALUES(?,?,?,?)",
            ).run(req.userId, data.client_id, digest, id);
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
