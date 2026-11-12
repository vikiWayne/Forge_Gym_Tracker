import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
export function categoryRoutes(app) {
  app.post(
    "/api/categories",
    handler(async (req, res) => {
      const { name } = z
        .object({ name: z.string().trim().min(1).max(50) })
        .parse(req.body);
      if (
        await db
          .prepare("SELECT id FROM categories WHERE user_id=? AND name=?")
          .get(req.userId, name)
      )
        return res.status(409).json({
          error:
            "You already have a category with that name. Choose it from your list.",
        });
      const id = randomUUID();
      await db
        .prepare("INSERT INTO categories VALUES(?,?,?)")
        .run(id, req.userId, name);
      res.status(201).json({ id, name });
    }),
  );
  app.put(
    "/api/categories/:id",
    handler(async (req, res) => {
      const { name } = z
        .object({ name: z.string().trim().min(1).max(50) })
        .parse(req.body);
      if (
        !(await db
          .prepare("SELECT id FROM categories WHERE id=? AND user_id=?")
          .get(req.params.id, req.userId))
      )
        return res.status(404).json({ error: "Category not found." });
      if (
        await db
          .prepare(
            "SELECT id FROM categories WHERE user_id=? AND name=? AND id<>?",
          )
          .get(req.userId, name, req.params.id)
      )
        return res.status(409).json({
          error:
            "You already have a category with that name. Choose another name.",
        });
      await db.transaction(async () => {
        await db
          .prepare("UPDATE categories SET name=? WHERE id=? AND user_id=?")
          .run(name, req.params.id, req.userId);
        await db
          .prepare(
            "UPDATE exercises SET category=? WHERE category_id=? AND user_id=?",
          )
          .run(name, req.params.id, req.userId);
      });
      res.json({ id: req.params.id, name });
    }),
  );
  app.delete(
    "/api/categories/:id",
    handler(async (req, res) => {
      const { target_category_id } = z
        .object({ target_category_id: z.string().uuid().optional() })
        .parse(req.body || {});
      if (
        !(await db
          .prepare("SELECT id FROM categories WHERE id=? AND user_id=?")
          .get(req.params.id, req.userId))
      )
        return res.status(404).json({ error: "Category not found." });
      const count = (
        await db
          .prepare(
            "SELECT COUNT(*) AS count FROM exercises WHERE category_id=? AND user_id=?",
          )
          .get(req.params.id, req.userId)
      ).count;
      const target = target_category_id
        ? await db
            .prepare(
              "SELECT * FROM categories WHERE id=? AND user_id=? AND id<>?",
            )
            .get(target_category_id, req.userId, req.params.id)
        : null;
      if (target_category_id && !target)
        return res
          .status(400)
          .json({ error: "Choose another category from your own library." });
      if (count && !target)
        return res.status(409).json({
          error:
            "Move the exercises to another category before deleting this category.",
        });
      await db.transaction(async () => {
        if (target)
          await db
            .prepare(
              "UPDATE exercises SET category_id=?,category=? WHERE category_id=? AND user_id=?",
            )
            .run(target.id, target.name, req.params.id, req.userId);
        await db
          .prepare("DELETE FROM categories WHERE id=? AND user_id=?")
          .run(req.params.id, req.userId);
      });
      res.json({ ok: true });
    }),
  );
}
