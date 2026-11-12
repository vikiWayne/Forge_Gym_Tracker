import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { dateSchema, decimalNumber } from "../../shared/validation.js";

export const measurementTypes = [
  "waist",
  "chest",
  "hips",
  "left-arm",
  "right-arm",
  "left-thigh",
  "right-thigh",
  "left-calf",
  "right-calf",
];
const schema = z.object({
  type: z.enum(measurementTypes),
  value: decimalNumber(0.01, 500),
  date: dateSchema,
  notes: z.string().trim().max(1000).default(""),
});
export async function measurementsRoutes(app) {
  await db.exec(`CREATE TABLE IF NOT EXISTS body_measurements(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),type TEXT NOT NULL,
    value REAL NOT NULL,date TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '');
    CREATE INDEX IF NOT EXISTS measurements_user_date ON body_measurements(user_id,type,date);`);
  app.get(
    "/api/measurements",
    handler(async (req, res) => {
      res.set("Cache-Control", "no-store");
      res.json({
        entries: await db
          .prepare(
            "SELECT id,type,value,date,notes FROM body_measurements WHERE user_id=? ORDER BY date DESC,rowid DESC",
          )
          .all(req.userId),
      });
    }),
  );
  for (const method of ["post", "put"])
    app[method](
      `/api/measurements${method === "put" ? "/:id" : ""}`,
      handler(async (req, res) => {
        const data = schema.parse(req.body);
        const id = method === "post" ? randomUUID() : req.params.id;
        if (method === "post")
          await db
            .prepare(
              "INSERT INTO body_measurements(id,user_id,type,value,date,notes) VALUES(?,?,?,?,?,?)",
            )
            .run(id, req.userId, data.type, data.value, data.date, data.notes);
        else {
          const result = await db
            .prepare(
              "UPDATE body_measurements SET type=?,value=?,date=?,notes=? WHERE id=? AND user_id=?",
            )
            .run(data.type, data.value, data.date, data.notes, id, req.userId);
          if (!result.changes)
            return res.status(404).json({ error: "Measurement not found." });
        }
        res.status(method === "post" ? 201 : 200).json({ id });
      }),
    );
  app.delete(
    "/api/measurements/:id",
    handler(async (req, res) => {
      const result = await db
        .prepare("DELETE FROM body_measurements WHERE id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
    }),
  );
}
