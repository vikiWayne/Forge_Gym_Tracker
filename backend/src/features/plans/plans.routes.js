import { withSets } from "../workouts/serialize.js";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
export function planRoutes(app) {
  app.post(
    "/api/plans",
    handler((req, res) => {
      const d = z
          .object({ name: z.string().trim().min(1).max(80) })
          .parse(req.body),
        id = randomUUID();
      db.prepare("INSERT INTO plans VALUES(?,?,?)").run(id, d.name, req.userId);
      db.prepare("INSERT INTO members VALUES(?,?,1)").run(id, req.userId);
      res.status(201).json({ id });
    }),
  );
  app.post(
    "/api/plans/:id/invite",
    handler((req, res) => {
      const { username } = z
        .object({ username: z.string().trim().min(1).max(30) })
        .parse(req.body);
      if (
        !db
          .prepare("SELECT id FROM plans WHERE id=? AND owner_id=?")
          .get(req.params.id, req.userId)
      )
        return res
          .status(403)
          .json({ error: "Only the plan owner can invite." });
      const u = db
        .prepare("SELECT id FROM users WHERE username=?")
        .get(username);
      if (!u)
        return res
          .status(404)
          .json({ error: "No account found with that username." });
      const membership = db
        .prepare("SELECT accepted FROM members WHERE plan_id=? AND user_id=?")
        .get(req.params.id, u.id);
      if (membership)
        return res.status(409).json({
          error: membership.accepted
            ? "That partner is already a member of this plan."
            : "An invitation is already pending for that partner.",
        });
      db.prepare("INSERT OR IGNORE INTO members VALUES(?,?,0)").run(
        req.params.id,
        u.id,
      );
      res.json({ ok: true });
    }),
  );
  app.post("/api/plans/:id/accept", (req, res) => {
    const r = db
      .prepare("UPDATE members SET accepted=1 WHERE plan_id=? AND user_id=?")
      .run(req.params.id, req.userId);
    res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
  });
  app.delete("/api/plans/:id/membership", (req, res) => {
    db.prepare("DELETE FROM members WHERE plan_id=? AND user_id=?").run(
      req.params.id,
      req.userId,
    );
    res.json({ ok: true });
  });
  app.get("/api/plans", (req, res) => {
    const plans = db
      .prepare(
        "SELECT p.*,m.accepted,u.username AS owner_name FROM plans p JOIN members m ON m.plan_id=p.id JOIN users u ON u.id=p.owner_id WHERE m.user_id=?",
      )
      .all(req.userId);
    res.json(
      plans.map((p) => ({
        ...p,
        pending_invites:
          p.owner_id === req.userId && p.accepted
            ? db
                .prepare(
                  "SELECT u.id,u.username FROM users u JOIN members m ON m.user_id=u.id WHERE m.plan_id=? AND m.accepted=0 ORDER BY u.username",
                )
                .all(p.id)
            : [],
        members: p.accepted
          ? db
              .prepare(
                "SELECT u.username,u.id FROM users u JOIN members m ON m.user_id=u.id WHERE m.plan_id=? AND m.accepted=1",
              )
              .all(p.id)
          : [],
        logs: p.accepted
          ? withSets(
              db
                .prepare(
                  "SELECT l.*,e.name,u.username FROM logs l JOIN exercises e ON e.id=l.exercise_id JOIN users u ON u.id=l.user_id JOIN members m ON m.user_id=l.user_id WHERE m.plan_id=? AND m.accepted=1 ORDER BY l.date DESC",
                )
                .all(p.id),
            )
          : [],
      })),
    );
  });
}
