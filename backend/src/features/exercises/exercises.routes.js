import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export function exerciseRoutes(app) {
  const exercise = z
    .object({
      rep_min: z.number().int().min(1).max(1000).default(8),
      rep_max: z.number().int().min(1).max(1000).default(12),
      name: z.string().trim().min(1).max(80),
      category_id: z.string().uuid(),
      notes: z.string().max(1000).default(""),
      ready: z.boolean().default(false),
    })
    .refine(
      (d) => d.rep_max >= d.rep_min,
      "Maximum reps must be at least minimum reps.",
    );
  app.post(
    "/api/exercises",
    handler(async (req, res) => {
      const d = exercise.parse(req.body),
        id = randomUUID();
      const category = await db
        .prepare("SELECT * FROM categories WHERE id=? AND user_id=?")
        .get(d.category_id, req.userId);
      if (!category)
        return res
          .status(400)
          .json({ error: "Choose one of your categories." });
      await db
        .prepare(
          "INSERT INTO exercises(id,user_id,name,category,notes,ready,rep_min,rep_max,category_id) VALUES(?,?,?,?,?,?,?,?,?)",
        )
        .run(
          id,
          req.userId,
          d.name,
          category.name,
          d.notes,
          +d.ready,
          d.rep_min,
          d.rep_max,
          d.category_id,
        );
      res.status(201).json({ id });
    }),
  );
  app.patch(
    "/api/exercises/:id",
    handler(async (req, res) => {
      const d = z
        .object({
          ready: z.boolean().optional(),
          category_id: z.string().uuid().optional(),
        })
        .refine(
          (value) =>
            value.ready !== undefined || value.category_id !== undefined,
          "Choose a category or readiness state.",
        )
        .parse(req.body);
      const existing = await db
        .prepare("SELECT * FROM exercises WHERE id=? AND user_id=?")
        .get(req.params.id, req.userId);
      if (!existing)
        return res.status(404).json({ error: "Exercise not found." });
      const category = d.category_id
        ? await db
            .prepare("SELECT * FROM categories WHERE id=? AND user_id=?")
            .get(d.category_id, req.userId)
        : null;
      if (d.category_id && !category)
        return res
          .status(400)
          .json({ error: "Choose one of your categories." });
      const r = await db
        .prepare(
          "UPDATE exercises SET ready=?,category_id=?,category=? WHERE id=? AND user_id=?",
        )
        .run(
          d.ready === undefined ? existing.ready : +d.ready,
          category?.id || existing.category_id,
          category?.name || existing.category,
          req.params.id,
          req.userId,
        );
      res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
    }),
  );
  app.put(
    "/api/exercises/:id",
    handler(async (req, res) => {
      const data = exercise.parse(req.body);
      if (
        !(await db
          .prepare("SELECT id FROM exercises WHERE id=? AND user_id=?")
          .get(req.params.id, req.userId))
      )
        return res.status(404).json({ error: "Exercise not found." });
      const category = await db
        .prepare("SELECT * FROM categories WHERE id=? AND user_id=?")
        .get(data.category_id, req.userId);
      if (!category)
        return res
          .status(400)
          .json({ error: "Choose one of your categories." });
      await db
        .prepare(
          "UPDATE exercises SET name=?,category_id=?,category=?,notes=?,rep_min=?,rep_max=? WHERE id=? AND user_id=?",
        )
        .run(
          data.name,
          category.id,
          category.name,
          data.notes,
          data.rep_min,
          data.rep_max,
          req.params.id,
          req.userId,
        );
      res.json({ ok: true });
    }),
  );
  app.delete(
    "/api/exercises/:id",
    handler(async (req, res) => {
      if (
        !(await db
          .prepare("SELECT id FROM exercises WHERE id=? AND user_id=?")
          .get(req.params.id, req.userId))
      )
        return res.status(404).json({ error: "Exercise not found." });
      await db.transaction(async () => {
        await db
          .prepare("DELETE FROM logs WHERE exercise_id=? AND user_id=?")
          .run(req.params.id, req.userId);
        await db
          .prepare("DELETE FROM exercises WHERE id=? AND user_id=?")
          .run(req.params.id, req.userId);
      });
      res.json({ ok: true });
    }),
  );
}
