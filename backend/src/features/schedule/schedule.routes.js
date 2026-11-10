import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";

// Planning dates deliberately allow the future, unlike journal entry dates.
const planningDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T12:00:00Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, "Choose a valid date.");
const schema = z.object({
  routine_id: z.string().uuid(),
  date: planningDate,
  notes: z.string().trim().max(1000).default(""),
});
const indiaDate = (time) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(time));

export function scheduleRoutes(app) {
  db.exec(`CREATE TABLE IF NOT EXISTS scheduled_workouts(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),
    routine_id TEXT REFERENCES routines(id) ON DELETE SET NULL,
    routine_name TEXT NOT NULL,date TEXT NOT NULL,notes TEXT NOT NULL DEFAULT '',
    completed_session_id TEXT REFERENCES training_sessions(id) ON DELETE SET NULL,
    completed_log_id TEXT REFERENCES logs(id) ON DELETE SET NULL,
    completed_at INTEGER);
    CREATE INDEX IF NOT EXISTS scheduled_user_date ON scheduled_workouts(user_id,date);`);

  app.get("/api/schedule", (req, res) => {
    db.prepare("UPDATE scheduled_workouts SET completed_at=NULL WHERE user_id=? AND completed_session_id IS NULL AND completed_log_id IS NULL AND completed_at IS NOT NULL").run(req.userId);
    const entries = db
      .prepare(
        `SELECT id,routine_id,routine_name,date,notes,
      completed_session_id,completed_log_id,completed_at,
      (SELECT COUNT(*) FROM logs l WHERE l.user_id=scheduled_workouts.user_id AND l.date=scheduled_workouts.date) AS logged_workouts
      FROM scheduled_workouts WHERE user_id=? ORDER BY date,id`,
      )
      .all(req.userId);
    res.json({ entries });
  });
  for (const method of ["post", "put"]) {
    app[method](
      `/api/schedule${method === "put" ? "/:id" : ""}`,
      handler((req, res) => {
        const data = schema.parse(req.body);
        if (method === "put") {
          const existing = db
            .prepare(
              "SELECT * FROM scheduled_workouts WHERE id=? AND user_id=?",
            )
            .get(req.params.id, req.userId);
          if (!existing)
            return res
              .status(404)
              .json({ error: "Scheduled workout not found." });
          if (existing.completed_at)
            return res
              .status(409)
              .json({ error: "Reopen this workout before changing its plan." });
        }
        const routine = db
          .prepare("SELECT id,name FROM routines WHERE id=? AND user_id=?")
          .get(data.routine_id, req.userId);
        if (!routine)
          return res
            .status(400)
            .json({ error: "Choose a routine from your account." });
        const id = method === "post" ? randomUUID() : req.params.id;
        if (method === "post")
          db.prepare(
            "INSERT INTO scheduled_workouts(id,user_id,routine_id,routine_name,date,notes) VALUES(?,?,?,?,?,?)",
          ).run(
            id,
            req.userId,
            routine.id,
            routine.name,
            data.date,
            data.notes,
          );
        else
          db.prepare(
            "UPDATE scheduled_workouts SET routine_id=?,routine_name=?,date=?,notes=? WHERE id=? AND user_id=?",
          ).run(
            routine.id,
            routine.name,
            data.date,
            data.notes,
            id,
            req.userId,
          );
        res.status(method === "post" ? 201 : 200).json({ id });
      }),
    );
  }
  app.post(
    "/api/schedule/:id/completion",
    handler((req, res) => {
      const data = z
        .object({
          session_id: z.string().uuid().optional(),
          log_id: z.string().uuid().optional(),
        })
        .refine(
          (value) => Boolean(value.session_id) !== Boolean(value.log_id),
          "Choose one completed session or journal workout.",
        )
        .parse(req.body);
      const entry = db
        .prepare("SELECT * FROM scheduled_workouts WHERE id=? AND user_id=?")
        .get(req.params.id, req.userId);
      if (!entry)
        return res.status(404).json({ error: "Scheduled workout not found." });
      if (data.session_id) {
        const session = db
          .prepare(
            "SELECT started_at FROM training_sessions WHERE id=? AND user_id=? AND finished_at IS NOT NULL",
          )
          .get(data.session_id, req.userId);
        if (!session || indiaDate(session.started_at) !== entry.date)
          return res
            .status(400)
            .json({
              error: "Choose a completed session from the planned date.",
            });
        const used = db
          .prepare(
            "SELECT id FROM scheduled_workouts WHERE user_id=? AND completed_session_id=? AND id<>?",
          )
          .get(req.userId, data.session_id, entry.id);
        if (used)
          return res
            .status(409)
            .json({
              error:
                "That session already completes another scheduled workout.",
            });
      } else {
        const log = db
          .prepare("SELECT date FROM logs WHERE id=? AND user_id=?")
          .get(data.log_id, req.userId);
        if (!log || log.date !== entry.date)
          return res
            .status(400)
            .json({ error: "Choose a saved workout from the planned date." });
        const used = db
          .prepare(
            "SELECT id FROM scheduled_workouts WHERE user_id=? AND completed_log_id=? AND id<>?",
          )
          .get(req.userId, data.log_id, entry.id);
        if (used)
          return res
            .status(409)
            .json({
              error:
                "That workout already completes another scheduled workout.",
            });
      }
      db.prepare(
        "UPDATE scheduled_workouts SET completed_session_id=?,completed_log_id=?,completed_at=? WHERE id=? AND user_id=?",
      ).run(
        data.session_id || null,
        data.log_id || null,
        Date.now(),
        entry.id,
        req.userId,
      );
      res.json({ ok: true });
    }),
  );
  app.delete("/api/schedule/:id/completion", (req, res) => {
    const result = db
      .prepare(
        "UPDATE scheduled_workouts SET completed_session_id=NULL,completed_log_id=NULL,completed_at=NULL WHERE id=? AND user_id=?",
      )
      .run(req.params.id, req.userId);
    res
      .status(result.changes ? 200 : 404)
      .json({ ok: Boolean(result.changes) });
  });
  app.delete("/api/schedule/:id", (req, res) => {
    const result = db
      .prepare("DELETE FROM scheduled_workouts WHERE id=? AND user_id=?")
      .run(req.params.id, req.userId);
    res
      .status(result.changes ? 200 : 404)
      .json({ ok: Boolean(result.changes) });
  });
}
