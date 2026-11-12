import { randomUUID } from "node:crypto";
import { db } from "../../database/connection.js";

export async function acceptedMember(planId, userId) {
  return Boolean(
    await db
      .prepare(
        "SELECT 1 FROM members WHERE plan_id=? AND user_id=? AND accepted=1",
      )
      .get(planId, userId),
  );
}
export async function routineSnapshot(routine) {
  return {
    name: routine.name,
    notes: routine.notes,
    exercises: await Promise.all(
      JSON.parse(routine.exercises).map(async (item) => {
        const exercise = await db
          .prepare(
            "SELECT name,category,notes,rep_min,rep_max FROM exercises WHERE id=? AND user_id=?",
          )
          .get(item.exercise_id, routine.user_id);
        if (!exercise)
          throw Object.assign(
            new Error(
              "Replace deleted exercises in this routine before sharing it.",
            ),
            { status: 400 },
          );
        return {
          ...exercise,
          sets: item.sets.map(({ weight, reps }) => ({ weight, reps })),
        };
      }),
    ),
  };
}
export async function copySharedRoutine(shared, userId) {
  return db.transaction(async () => {
    const previous = await db
      .prepare(
        "SELECT routine_id FROM shared_routine_copies WHERE shared_id=? AND user_id=?",
      )
      .get(shared.id, userId);
    if (
      previous &&
      (await db
        .prepare("SELECT 1 FROM routines WHERE id=? AND user_id=?")
        .get(previous.routine_id, userId))
    )
      return { id: previous.routine_id, already_imported: true };
    const snapshot = JSON.parse(shared.snapshot);
    const exercises = [];
    for (const item of snapshot.exercises) {
      let category = await db
        .prepare(
          "SELECT id FROM categories WHERE user_id=? AND name=? COLLATE NOCASE",
        )
        .get(userId, item.category);
      if (!category) {
        category = { id: randomUUID() };
        await db
          .prepare("INSERT INTO categories(id,user_id,name) VALUES(?,?,?)")
          .run(category.id, userId, item.category);
      }
      const matches = await db
        .prepare(
          "SELECT id FROM exercises WHERE user_id=? AND category_id=? AND name=? COLLATE NOCASE",
        )
        .all(userId, category.id, item.name);
      if (matches.length > 1)
        throw Object.assign(
          new Error(
            `Rename duplicate exercises named “${item.name}” in “${item.category}” before importing.`,
          ),
          { status: 409 },
        );
      let exercise = matches[0];
      if (!exercise) {
        exercise = { id: randomUUID() };
        await db
          .prepare(
            "INSERT INTO exercises(id,user_id,name,category,category_id,notes,rep_min,rep_max,ready) VALUES(?,?,?,?,?,?,?,?,0)",
          )
          .run(
            exercise.id,
            userId,
            item.name,
            item.category,
            category.id,
            item.notes,
            item.rep_min ?? 8,
            item.rep_max ?? 12,
          );
      }
      exercises.push({ exercise_id: exercise.id, sets: item.sets });
    }
    const id = randomUUID();
    await db
      .prepare(
        "INSERT INTO routines(id,user_id,name,notes,exercises) VALUES(?,?,?,?,?)",
      )
      .run(
        id,
        userId,
        snapshot.name,
        snapshot.notes,
        JSON.stringify(exercises),
      );
    await db
      .prepare(
        "INSERT INTO shared_routine_copies(shared_id,user_id,routine_id) VALUES(?,?,?) ON CONFLICT(shared_id,user_id) DO UPDATE SET routine_id=excluded.routine_id",
      )
      .run(shared.id, userId, id);

    return { id, already_imported: false };
  });
}
