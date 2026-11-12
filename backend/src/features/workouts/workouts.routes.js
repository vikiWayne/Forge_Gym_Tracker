import { dateSchema, liftWeightSchema } from "../../shared/validation.js";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { effortFields } from "./effort.js";
import { setInserts } from "./saveSets.js";
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
async function saveSets(id, sets) {
  await db.prepare("DELETE FROM log_sets WHERE log_id=?").run(id);
  await db.batch(setInserts(id, sets));
}
export async function workoutRoutes(app) {
  await db.exec(
    "CREATE TABLE IF NOT EXISTS offline_workout_receipts(user_id TEXT NOT NULL REFERENCES users(id),client_id TEXT NOT NULL,digest TEXT NOT NULL,log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,PRIMARY KEY(user_id,client_id))",
  );
  for (const method of ["post", "put"])
    app[method](
      "/api/logs" + (method === "put" ? "/:id" : ""),
      handler(async (req, res) => {
        const data = workoutSchema.parse(req.body);
        const result = await db.transaction(async () => {
          const digest = createHash("sha256")
            .update(JSON.stringify(data))
            .digest("hex");
          if (method === "post" && data.client_id) {
            const receipt = await db
              .prepare(
                "SELECT digest,log_id FROM offline_workout_receipts WHERE user_id=? AND client_id=?",
              )
              .get(req.userId, data.client_id);
            if (receipt) {
              if (receipt.digest !== digest)
                return {
                  status: 409,
                  body: {
                    error:
                      "This saved offline workout has different content. Resolve it before retrying.",
                  },
                };
              return { status: 200, body: { id: receipt.log_id } };
            }
          }
          if (
            !(await db
              .prepare("SELECT id FROM exercises WHERE id=? AND user_id=?")
              .get(data.exercise_id, req.userId))
          )
            return {
              status: 400,
              body: { error: "Choose one of your exercises." },
            };
          if (
            method === "put" &&
            !(await db
              .prepare("SELECT id FROM logs WHERE id=? AND user_id=?")
              .get(req.params.id, req.userId))
          )
            return { status: 404, body: { error: "Workout not found." } };
          const id = method === "post" ? randomUUID() : req.params.id;
          // Keep the heaviest set as a derived summary for progress charts.
          const best = data.sets.reduce((a, b) =>
            b.weight > a.weight ? b : a,
          );
          if (method === "post")
            await db
              .prepare("INSERT INTO logs VALUES(?,?,?,?,?,?,?)")
              .run(
                id,
                req.userId,
                data.exercise_id,
                best.weight,
                best.reps,
                data.date,
                data.notes,
              );
          else
            await db
              .prepare(
                "UPDATE logs SET exercise_id=?,weight=?,reps=?,date=?,notes=? WHERE id=? AND user_id=?",
              )
              .run(
                data.exercise_id,
                best.weight,
                best.reps,
                data.date,
                data.notes,
                id,
                req.userId,
              );
          await saveSets(id, data.sets);
          if (method === "post" && data.client_id)
            await db
              .prepare(
                "INSERT INTO offline_workout_receipts(user_id,client_id,digest,log_id) VALUES(?,?,?,?)",
              )
              .run(req.userId, data.client_id, digest, id);
          return { status: method === "post" ? 201 : 200, body: { id } };
        });
        res.status(result.status).json(result.body);
      }),
    );
  app.delete(
    "/api/logs/:id",
    handler(async (req, res) => {
      const result = await db
        .prepare("DELETE FROM logs WHERE id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
    }),
  );
}
