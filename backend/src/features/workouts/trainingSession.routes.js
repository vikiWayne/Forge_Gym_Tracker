import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { routineExercise, ownsExercises } from "./routines.routes.js";
import { effortFields } from "./effort.js";
import {
  catalogExercise,
  movements,
  starters,
  withCatalogWrite,
} from "./starterCatalog.js";

const sessionExercise = routineExercise.extend({
  name: z.string().min(1).max(80),
  sets: z
    .array(
      routineExercise.shape.sets.element.extend({
        done: z.boolean(),
        ...effortFields,
      }),
    )
    .min(1)
    .max(50),
});
const updateSchema = z.object({
  exercises: z.array(sessionExercise).min(1).max(20),
  notes: z.string().max(1000),
  rest_seconds: z.number().int().min(5).max(600),
  rest_until: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER).nullable(),
});
function serialize(row) {
  if (!row) return null;
  const { user_id, exercises, ...session } = row;
  return { ...session, exercises: JSON.parse(exercises) };
}
function createSession(userId, name, notes, exercises) {
  const snapshot = exercises.map((item) => ({
    ...item,
    name: db
      .prepare("SELECT name FROM exercises WHERE id=? AND user_id=?")
      .get(item.exercise_id, userId).name,
    sets: item.sets.map((set) => ({ ...set, done: false })),
  }));
  const id = randomUUID();
  db.prepare(
    "INSERT INTO training_sessions(id,user_id,name,started_at,exercises,notes) VALUES(?,?,?,?,?,?)",
  ).run(id, userId, name, Date.now(), JSON.stringify(snapshot), notes);
  return serialize(
    db.prepare("SELECT * FROM training_sessions WHERE id=?").get(id),
  );
}
export function trainingSessionRoutes(app) {
  app.get("/api/training-sessions", (req, res) =>
    res.json(
      db
        .prepare(
          "SELECT id,name,started_at,finished_at FROM training_sessions WHERE user_id=? AND finished_at IS NOT NULL ORDER BY finished_at DESC LIMIT 20",
        )
        .all(req.userId),
    ),
  );
  app.get("/api/training-session", (req, res) =>
    res.json(
      serialize(
        db
          .prepare(
            "SELECT * FROM training_sessions WHERE user_id=? AND finished_at IS NULL",
          )
          .get(req.userId),
      ),
    ),
  );
  app.post(
    "/api/training-session",
    handler((req, res) => {
      const { routine_id, starter_id } = z
        .union([
          z.strictObject({ routine_id: z.string().uuid() }),
          z.strictObject({ starter_id: z.string().min(1).max(80) }),
        ])
        .transform((data) => ({
          routine_id: undefined,
          starter_id: undefined,
          ...data,
        }))
        .parse(req.body);
      const active = db
        .prepare(
          "SELECT * FROM training_sessions WHERE user_id=? AND finished_at IS NULL",
        )
        .get(req.userId);
      if (active)
        return res
          .status(409)
          .json({ error: "Resume or discard your active workout first." });
      if (starter_id) {
        const starter = starters.find((entry) => entry.id === starter_id);
        if (!starter)
          return res.status(404).json({ error: "Starter routine not found." });
        const session = withCatalogWrite(() => {
          const exercises = starter.movements.map(({ id, sets, reps }) => ({
            exercise_id: catalogExercise(
              req.userId,
              movements.find((entry) => entry.id === id),
            ),
            sets: Array.from({ length: sets }, () => ({ weight: 0, reps })),
          }));
          return createSession(req.userId, starter.name, "", exercises);
        });
        return res.status(201).json(session);
      }
      const routine = db
        .prepare("SELECT * FROM routines WHERE id=? AND user_id=?")
        .get(routine_id, req.userId);
      if (!routine)
        return res.status(404).json({ error: "Routine not found." });
      const exercises = JSON.parse(routine.exercises);
      if (!ownsExercises(exercises, req.userId))
        return res.status(400).json({
          error:
            "This routine contains a deleted exercise. Edit it before starting.",
        });
      res
        .status(201)
        .json(
          createSession(req.userId, routine.name, routine.notes, exercises),
        );
    }),
  );
  app.put(
    "/api/training-session/:id",
    handler((req, res) => {
      const data = updateSchema.parse(req.body);
      const current = db
        .prepare(
          "SELECT * FROM training_sessions WHERE id=? AND user_id=? AND finished_at IS NULL",
        )
        .get(req.params.id, req.userId);
      if (!current)
        return res.status(404).json({ error: "Active workout not found." });
      const original = JSON.parse(current.exercises);
      if (
        original.length !== data.exercises.length ||
        original.some(
          (item, index) =>
            item.exercise_id !== data.exercises[index].exercise_id,
        )
      )
        return res
          .status(400)
          .json({ error: "The exercises must match the started routine." });
      db.prepare(
        "UPDATE training_sessions SET exercises=?,notes=?,rest_seconds=?,rest_until=? WHERE id=?",
      ).run(
        JSON.stringify(data.exercises),
        data.notes,
        data.rest_seconds,
        data.rest_until,
        current.id,
      );
      res.json({ ok: true });
    }),
  );
  app.delete("/api/training-session/:id", (req, res) => {
    const result = db
      .prepare(
        "DELETE FROM training_sessions WHERE id=? AND user_id=? AND finished_at IS NULL",
      )
      .run(req.params.id, req.userId);
    res.status(result.changes ? 200 : 404).json({ ok: !!result.changes });
  });
  app.post(
    "/api/training-session/:id/finish",
    handler((req, res) => {
      const current = db
        .prepare("SELECT * FROM training_sessions WHERE id=? AND user_id=?")
        .get(req.params.id, req.userId);
      if (!current)
        return res.status(404).json({ error: "Workout not found." });
      if (current.finished_at) return res.json({ ok: true });
      const exercises = JSON.parse(current.exercises)
        .map((item) => ({ ...item, sets: item.sets.filter((set) => set.done) }))
        .filter((item) => item.sets.length);
      if (!exercises.length)
        return res
          .status(400)
          .json({ error: "Complete at least one set before finishing." });
      if (!ownsExercises(exercises, req.userId))
        return res.status(400).json({
          error:
            "An exercise was deleted. Discard this session and start an updated routine.",
        });
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(current.started_at));
      db.exec("BEGIN IMMEDIATE");
      try {
        for (const exercise of exercises) {
          const id = randomUUID(),
            best = exercise.sets.reduce((a, b) =>
              b.weight > a.weight ? b : a,
            );
          db.prepare("INSERT INTO logs VALUES(?,?,?,?,?,?,?)").run(
            id,
            req.userId,
            exercise.exercise_id,
            best.weight,
            best.reps,
            date,
            current.notes,
          );
          exercise.sets.forEach((set, index) =>
            db
              .prepare(
                "INSERT INTO log_sets(log_id,position,weight,reps,rpe,rir) VALUES(?,?,?,?,?,?)",
              )
              .run(
                id,
                index + 1,
                set.weight,
                set.reps,
                set.rpe ?? null,
                set.rir ?? null,
              ),
          );
        }
        db.prepare(
          "UPDATE training_sessions SET finished_at=?,rest_until=NULL WHERE id=?",
        ).run(Date.now(), current.id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.json({ ok: true });
    }),
  );
}
