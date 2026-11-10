import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import {
  acceptedMember,
  copySharedRoutine,
  routineSnapshot,
} from "./sharedRoutineService.js";

export function sharedRoutineRoutes(app) {
  db.exec(`CREATE TABLE IF NOT EXISTS shared_routines(
    id TEXT PRIMARY KEY,plan_id TEXT NOT NULL,user_id TEXT NOT NULL,
    source_routine_id TEXT NOT NULL,snapshot TEXT NOT NULL,shared_at INTEGER NOT NULL,
    UNIQUE(plan_id,user_id,source_routine_id),
    FOREIGN KEY(plan_id,user_id) REFERENCES members(plan_id,user_id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS shared_routine_copies(
      shared_id TEXT NOT NULL REFERENCES shared_routines(id) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES users(id),routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      PRIMARY KEY(shared_id,user_id));`);
  const prefix = "/api/plans/:id/routines";
  function member(req, res) {
    if (acceptedMember(req.params.id, req.userId)) return true;
    res.status(404).json({ error: "Accepted plan membership not found." });
    return false;
  }
  app.get(prefix, (req, res) => {
    if (!member(req, res)) return;
    const shares = db
      .prepare(
        `SELECT s.id,s.user_id,s.shared_at,s.snapshot,u.username,
      (SELECT routine_id FROM shared_routine_copies c WHERE c.shared_id=s.id AND c.user_id=?) AS imported_routine_id
      FROM shared_routines s JOIN users u ON u.id=s.user_id
      JOIN members m ON m.plan_id=s.plan_id AND m.user_id=s.user_id AND m.accepted=1
      WHERE s.plan_id=? ORDER BY s.shared_at DESC LIMIT 100`,
      )
      .all(req.userId, req.params.id);
    res
      .set("Cache-Control", "no-store")
      .json(
        shares.map(({ snapshot, ...row }) => ({
          ...row,
          ...JSON.parse(snapshot),
        })),
      );
  });
  app.post(
    prefix,
    handler((req, res) => {
      if (!member(req, res)) return;
      const { routine_id, include_notes } = z
        .object({
          routine_id: z.string().uuid(),
          include_notes: z.literal(true),
        })
        .parse(req.body);
      const routine = db
        .prepare("SELECT * FROM routines WHERE id=? AND user_id=?")
        .get(routine_id, req.userId);
      if (!routine)
        return res.status(404).json({ error: "Routine not found." });
      let snapshot;
      try {
        snapshot = routineSnapshot(routine);
      } catch (error) {
        if (error.status === 400)
          return res.status(400).json({ error: error.message });
        throw error;
      }
      const existing = db
        .prepare(
          "SELECT id FROM shared_routines WHERE plan_id=? AND user_id=? AND source_routine_id=?",
        )
        .get(req.params.id, req.userId, routine.id);
      const id = existing?.id || randomUUID();
      db.prepare(
        "INSERT INTO shared_routines(id,plan_id,user_id,source_routine_id,snapshot,shared_at) VALUES(?,?,?,?,?,?) ON CONFLICT(plan_id,user_id,source_routine_id) DO UPDATE SET snapshot=excluded.snapshot,shared_at=excluded.shared_at",
      ).run(
        id,
        req.params.id,
        req.userId,
        routine.id,
        JSON.stringify(snapshot),
        Date.now(),
      );
      res.status(existing ? 200 : 201).json({ id });
    }),
  );
  app.post(
    `${prefix}/:sharedId/import`,
    handler((req, res) => {
      if (!member(req, res)) return;
      const shared = db
        .prepare(
          `SELECT s.* FROM shared_routines s JOIN members m ON m.plan_id=s.plan_id AND m.user_id=s.user_id AND m.accepted=1 WHERE s.id=? AND s.plan_id=?`,
        )
        .get(req.params.sharedId, req.params.id);
      if (!shared)
        return res.status(404).json({ error: "Shared routine not found." });
      try {
        res.json(copySharedRoutine(shared, req.userId));
      } catch (error) {
        if (error.status === 409)
          return res.status(409).json({ error: error.message });
        throw error;
      }
    }),
  );
  app.delete(`${prefix}/:sharedId`, (req, res) => {
    if (!member(req, res)) return;
    const result = db
      .prepare(
        "DELETE FROM shared_routines WHERE id=? AND plan_id=? AND user_id=?",
      )
      .run(req.params.sharedId, req.params.id, req.userId);
    res
      .status(result.changes ? 200 : 404)
      .json({ ok: Boolean(result.changes) });
  });
}
