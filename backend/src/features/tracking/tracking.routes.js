import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import {
  bodyWeightSchema,
  dateSchema,
  decimalNumber,
} from "../../shared/validation.js";
async function syncWeight(userId) {
  const latest = await db
    .prepare(
      "SELECT value FROM weight_entries WHERE user_id=? ORDER BY date DESC,rowid DESC LIMIT 1",
    )
    .get(userId);
  if (latest)
    await db
      .prepare("UPDATE users SET weight=? WHERE id=?")
      .run(latest.value, userId);
}
export function trackingRoutes(app) {
  for (const [path, table, valueSchema] of [
    ["protein", "protein_entries", decimalNumber(0.01, 10000)],
    ["body-weight", "weight_entries", bodyWeightSchema],
  ]) {
    const schema = z.object({
      value: valueSchema,
      date: dateSchema,
      label: z.string().trim().max(100).default(""),
      notes: z.string().max(1000).default(""),
    });
    app.get(
      `/api/${path}`,
      handler(async (req, res) =>
        res.json({
          entries: await db
            .prepare(
              `SELECT id,value,date,label,notes FROM ${table} WHERE user_id=? ORDER BY date DESC,rowid DESC`,
            )
            .all(req.userId),
        }),
      ),
    );
    for (const method of ["post", "put"])
      app[method](
        `/api/${path}${method === "put" ? "/:id" : ""}`,
        handler(async (req, res) => {
          const data = schema.parse(req.body);
          if (
            method === "put" &&
            !(await db
              .prepare(`SELECT id FROM ${table} WHERE id=? AND user_id=?`)
              .get(req.params.id, req.userId))
          )
            return res.status(404).json({ error: "Entry not found." });
          const id = method === "post" ? randomUUID() : req.params.id;
          await db.transaction(async () => {
            if (method === "post")
              await db
                .prepare(`INSERT INTO ${table} VALUES(?,?,?,?,?,?)`)
                .run(
                  id,
                  req.userId,
                  data.value,
                  data.date,
                  data.label,
                  data.notes,
                );
            else
              await db
                .prepare(
                  `UPDATE ${table} SET value=?,date=?,label=?,notes=? WHERE id=? AND user_id=?`,
                )
                .run(
                  data.value,
                  data.date,
                  data.label,
                  data.notes,
                  id,
                  req.userId,
                );
            if (path === "body-weight") await syncWeight(req.userId);
          });
          res.status(method === "post" ? 201 : 200).json({ id });
        }),
      );
    app.delete(
      `/api/${path}/:id`,
      handler(async (req, res) => {
        if (
          !(await db
            .prepare(`SELECT id FROM ${table} WHERE id=? AND user_id=?`)
            .get(req.params.id, req.userId))
        )
          return res.status(404).json({ error: "Entry not found." });
        await db.transaction(async () => {
          await db
            .prepare(`DELETE FROM ${table} WHERE id=? AND user_id=?`)
            .run(req.params.id, req.userId);
          if (path === "body-weight") await syncWeight(req.userId);
        });
        res.json({ ok: true });
      }),
    );
  }
}
