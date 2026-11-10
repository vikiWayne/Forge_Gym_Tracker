import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { liftWeightSchema } from "../../shared/validation.js";

export const routineExercise = z.object({
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
});
const schema = z.object({
  name: z.string().trim().min(1).max(80),
  notes: z.string().max(1000).default(""),
  exercises: z.array(routineExercise).min(1).max(20),
});
export function ownsExercises(exercises, userId) {
  const find = db.prepare("SELECT id FROM exercises WHERE id=? AND user_id=?");
  return exercises.every((item) => find.get(item.exercise_id, userId));
}
export function routinesRoutes(app) {
  app.get("/api/routines", (req, res) => {
    res.json(
      db
        .prepare("SELECT * FROM routines WHERE user_id=? ORDER BY name")
        .all(req.userId)
        .map(({ user_id, exercises, ...routine }) => ({
          ...routine,
          exercises: JSON.parse(exercises),
        })),
    );
  });
  for (const method of ["post", "put"])
    app[method](
      `/api/routines${method === "put" ? "/:id" : ""}`,
      handler((req, res) => {
        const data = schema.parse(req.body);
        if (!ownsExercises(data.exercises, req.userId))
          return res
            .status(400)
            .json({ error: "Choose exercises from your own library." });
        const id = method === "post" ? randomUUID() : req.params.id;
        if (method === "put") {
          const result = db
            .prepare(
              "UPDATE routines SET name=?,notes=?,exercises=? WHERE id=? AND user_id=?",
            )
            .run(
              data.name,
              data.notes,
              JSON.stringify(data.exercises),
              id,
              req.userId,
            );
          if (!result.changes)
            return res.status(404).json({ error: "Routine not found." });
        } else
          db.prepare("INSERT INTO routines VALUES(?,?,?,?,?)").run(
            id,
            req.userId,
            data.name,
            data.notes,
            JSON.stringify(data.exercises),
          );
        res.status(method === "post" ? 201 : 200).json({ id });
      }),
    );
  app.delete("/api/routines/:id", (req, res) => {
    const result = db
      .prepare("DELETE FROM routines WHERE id=? AND user_id=?")
      .run(req.params.id, req.userId);
    res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
  });
}
