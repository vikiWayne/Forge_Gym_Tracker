import { withSets } from "../workouts/serialize.js";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  initializeSharing,
  sharingFor,
  sharedLogs,
  sharingRoutes,
} from "./privacy.js";
export async function planRoutes(app) {
  await initializeSharing();
  sharingRoutes(app);
  app.post(
    "/api/plans",
    handler(async (req, res) => {
      const d = z
          .object({ name: z.string().trim().min(1).max(80) })
          .parse(req.body),
        id = randomUUID();
      await db
        .prepare("INSERT INTO plans VALUES(?,?,?)")
        .run(id, d.name, req.userId);
      await db.prepare("INSERT INTO members VALUES(?,?,1)").run(id, req.userId);
      res.status(201).json({ id });
    }),
  );
  app.post(
    "/api/plans/:id/invite",
    handler(async (req, res) => {
      const { username } = z
        .object({ username: z.string().trim().min(1).max(30) })
        .parse(req.body);
      if (
        !(await db
          .prepare("SELECT id FROM plans WHERE id=? AND owner_id=?")
          .get(req.params.id, req.userId))
      )
        return res
          .status(403)
          .json({ error: "Only the plan owner can invite." });
      const u = await db
        .prepare("SELECT id FROM users WHERE username=?")
        .get(username);
      if (!u)
        return res
          .status(404)
          .json({ error: "No account found with that username." });
      const membership = await db
        .prepare("SELECT accepted FROM members WHERE plan_id=? AND user_id=?")
        .get(req.params.id, u.id);
      if (membership)
        return res.status(409).json({
          error: membership.accepted
            ? "That partner is already a member of this plan."
            : "An invitation is already pending for that partner.",
        });
      await db
        .prepare("INSERT OR IGNORE INTO members VALUES(?,?,0)")
        .run(req.params.id, u.id);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/plans/:id/accept",
    handler(async (req, res) => {
      const r = await db
        .prepare("UPDATE members SET accepted=1 WHERE plan_id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.status(r.changes ? 200 : 404).json({ ok: !!r.changes });
    }),
  );
  app.delete(
    "/api/plans/:id/membership",
    handler(async (req, res) => {
      await db
        .prepare("DELETE FROM members WHERE plan_id=? AND user_id=?")
        .run(req.params.id, req.userId);
      res.json({ ok: true });
    }),
  );
  app.get(
    "/api/plans",
    handler(async (req, res) => {
      const plans = await db
        .prepare(
          "SELECT p.*,m.accepted,u.username AS owner_name FROM plans p JOIN members m ON m.plan_id=p.id JOIN users u ON u.id=p.owner_id WHERE m.user_id=?",
        )
        .all(req.userId);
      res.json(
        await Promise.all(
          plans.map(async (p) => ({
            ...p,
            sharing: await sharingFor(p.id, req.userId),
            pending_invites:
              p.owner_id === req.userId && p.accepted
                ? await db
                    .prepare(
                      "SELECT u.id,u.username FROM users u JOIN members m ON m.user_id=u.id WHERE m.plan_id=? AND m.accepted=0 ORDER BY u.username",
                    )
                    .all(p.id)
                : [],
            members: p.accepted
              ? await db
                  .prepare(
                    "SELECT u.username,u.id FROM users u JOIN members m ON m.user_id=u.id WHERE m.plan_id=? AND m.accepted=1",
                  )
                  .all(p.id)
              : [],
            logs: p.accepted
              ? await withSets(await sharedLogs(p.id, req.userId))
              : [],
          })),
        ),
      );
    }),
  );
}
