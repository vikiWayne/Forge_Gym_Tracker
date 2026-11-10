import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";

export function initializeSharing() {
  db.exec(`CREATE TABLE IF NOT EXISTS plan_sharing(
    plan_id TEXT NOT NULL,user_id TEXT NOT NULL,mode TEXT NOT NULL DEFAULT 'none',
    include_notes INTEGER NOT NULL DEFAULT 0,PRIMARY KEY(plan_id,user_id),
    FOREIGN KEY(plan_id,user_id) REFERENCES members(plan_id,user_id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS plan_shared_logs(
    plan_id TEXT NOT NULL,user_id TEXT NOT NULL,log_id TEXT NOT NULL REFERENCES logs(id) ON DELETE CASCADE,
    PRIMARY KEY(plan_id,user_id,log_id),
    FOREIGN KEY(plan_id,user_id) REFERENCES members(plan_id,user_id) ON DELETE CASCADE);`);
}
export function sharingFor(planId, userId) {
  const preference = db
    .prepare(
      "SELECT mode,include_notes FROM plan_sharing WHERE plan_id=? AND user_id=?",
    )
    .get(planId, userId);
  return {
    mode: preference?.mode || "none",
    include_notes: Boolean(preference?.include_notes),
    selected_log_ids: db
      .prepare(
        "SELECT log_id FROM plan_shared_logs WHERE plan_id=? AND user_id=? ORDER BY log_id",
      )
      .all(planId, userId)
      .map((row) => row.log_id),
  };
}
export function sharedLogs(planId, viewerId) {
  return db
    .prepare(
      `SELECT l.id,l.user_id,l.exercise_id,l.weight,l.reps,l.date,
    CASE WHEN l.user_id=? OR p.include_notes=1 THEN l.notes ELSE '' END AS notes,
    e.name,u.username
    FROM logs l JOIN exercises e ON e.id=l.exercise_id JOIN users u ON u.id=l.user_id
    JOIN members m ON m.user_id=l.user_id AND m.plan_id=? AND m.accepted=1
    LEFT JOIN plan_sharing p ON p.plan_id=m.plan_id AND p.user_id=m.user_id
    WHERE l.user_id=? OR p.mode='all' OR (p.mode='selected' AND EXISTS(
      SELECT 1 FROM plan_shared_logs s WHERE s.plan_id=m.plan_id AND s.user_id=l.user_id AND s.log_id=l.id))
    ORDER BY l.date DESC,l.rowid DESC`,
    )
    .all(viewerId, planId, viewerId);
}
export function sharingRoutes(app) {
  const schema = z.object({
    mode: z.enum(["none", "selected", "all"]),
    include_notes: z.boolean(),
    selected_log_ids: z.array(z.string().uuid()).max(1000).default([]),
  });
  app.put(
    "/api/plans/:id/sharing",
    handler((req, res) => {
      const membership = db
        .prepare("SELECT accepted FROM members WHERE plan_id=? AND user_id=?")
        .get(req.params.id, req.userId);
      if (!membership?.accepted)
        return res
          .status(404)
          .json({ error: "Accepted plan membership not found." });
      const data = schema.parse(req.body);
      const ids = [...new Set(data.selected_log_ids)];
      const owned = db.prepare("SELECT id FROM logs WHERE id=? AND user_id=?");
      if (ids.some((id) => !owned.get(id, req.userId)))
        return res
          .status(400)
          .json({ error: "Select workouts from your own journal." });
      db.exec("BEGIN");
      try {
        db.prepare(
          "INSERT INTO plan_sharing(plan_id,user_id,mode,include_notes) VALUES(?,?,?,?) ON CONFLICT(plan_id,user_id) DO UPDATE SET mode=excluded.mode,include_notes=excluded.include_notes",
        ).run(req.params.id, req.userId, data.mode, +data.include_notes);
        db.prepare(
          "DELETE FROM plan_shared_logs WHERE plan_id=? AND user_id=?",
        ).run(req.params.id, req.userId);
        const insert = db.prepare(
          "INSERT INTO plan_shared_logs(plan_id,user_id,log_id) VALUES(?,?,?)",
        );
        for (const id of ids) insert.run(req.params.id, req.userId, id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.json(sharingFor(req.params.id, req.userId));
    }),
  );
}
