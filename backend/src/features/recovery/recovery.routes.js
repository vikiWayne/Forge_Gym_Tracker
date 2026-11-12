import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { dateSchema, decimalNumber } from "../../shared/validation.js";

const schema = z.object({
  date: dateSchema,
  sleep_hours: decimalNumber(0, 24),
  energy: z.number().int().min(1).max(5),
  soreness: z.number().int().min(1).max(5),
  mood: z.number().int().min(1).max(5),
  notes: z.string().trim().max(1000).default(""),
});
export async function recoveryRoutes(app) {
  await db.exec(`CREATE TABLE IF NOT EXISTS recovery_entries(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),date TEXT NOT NULL,
    sleep_hours REAL NOT NULL,energy INTEGER NOT NULL,soreness INTEGER NOT NULL,
    mood INTEGER NOT NULL,notes TEXT NOT NULL DEFAULT '',UNIQUE(user_id,date));`);
  app.get(
    "/api/recovery",
    handler(async (req, res) => {
      res.set("Cache-Control", "no-store").json({
        entries: await db
          .prepare(
            "SELECT id,date,sleep_hours,energy,soreness,mood,notes FROM recovery_entries WHERE user_id=? ORDER BY date DESC",
          )
          .all(req.userId),
      });
    }),
  );
  for (const method of ["post", "put"])
    app[method](
      `/api/recovery${method === "put" ? "/:id" : ""}`,
      handler(async (req, res) => {
        const data = schema.parse(req.body);
        const id = method === "post" ? randomUUID() : req.params.id;
        if (
          method === "put" &&
          !(await db
            .prepare("SELECT id FROM recovery_entries WHERE id=? AND user_id=?")
            .get(id, req.userId))
        )
          return res.status(404).json({ error: "Recovery entry not found." });
        if (
          await db
            .prepare(
              "SELECT id FROM recovery_entries WHERE user_id=? AND date=? AND id<>?",
            )
            .get(req.userId, data.date, id)
        )
          return res.status(409).json({
            error:
              "You already have a recovery entry for this date. Edit it from your timeline.",
          });
        if (method === "post")
          await db
            .prepare(
              "INSERT INTO recovery_entries(id,user_id,date,sleep_hours,energy,soreness,mood,notes) VALUES(?,?,?,?,?,?,?,?)",
            )
            .run(
              id,
              req.userId,
              data.date,
              data.sleep_hours,
              data.energy,
              data.soreness,
              data.mood,
              data.notes,
            );
        else
          await db
            .prepare(
              "UPDATE recovery_entries SET date=?,sleep_hours=?,energy=?,soreness=?,mood=?,notes=? WHERE id=? AND user_id=?",
            )
            .run(
              data.date,
              data.sleep_hours,
              data.energy,
              data.soreness,
              data.mood,
              data.notes,
              id,
              req.userId,
            );
        res.status(method === "post" ? 201 : 200).json({ id });
      }),
    );
  app.delete(
    "/api/recovery/:id",
    handler(async (req, res) => {
      const result = await db
        .prepare("DELETE FROM recovery_entries WHERE id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
    }),
  );
}
