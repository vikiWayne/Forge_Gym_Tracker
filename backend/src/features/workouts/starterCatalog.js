import { randomUUID } from "node:crypto";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";

export const movements = [
  {
    id: "squat",
    name: "Bodyweight squat",
    equipment: "Bodyweight",
    focus: "Legs",
    cues: [
      "Stand with your feet about shoulder-width apart.",
      "Bend at the hips and knees, keeping your whole foot on the floor.",
      "Stand back up smoothly. Use a depth you can control.",
    ],
  },
  {
    id: "incline-push-up",
    name: "Incline push-up",
    equipment: "Stable counter",
    focus: "Chest",
    cues: [
      "Place your hands on a sturdy, immovable counter and step back.",
      "Keep a straight line from shoulders to heels as you bend your elbows.",
      "Press away from the counter without letting your hips sag.",
    ],
  },
  {
    id: "bridge",
    name: "Glute bridge",
    equipment: "Bodyweight",
    focus: "Glutes",
    cues: [
      "Lie on your back with knees bent and feet flat.",
      "Press through your feet and lift your hips until shoulders, hips, and knees line up.",
      "Lower slowly. Keep your ribs relaxed and avoid arching your lower back.",
    ],
  },
  {
    id: "row",
    name: "Bent-over dumbbell row",
    equipment: "Dumbbells",
    focus: "Back",
    cues: [
      "Soften your knees and hinge at your hips with the weights hanging below your shoulders.",
      "Pull your elbows toward your ribs while keeping your torso steady.",
      "Lower the dumbbells under control.",
    ],
  },
  {
    id: "hinge",
    name: "Dumbbell Romanian deadlift",
    equipment: "Dumbbells",
    focus: "Hamstrings",
    cues: [
      "Stand with dumbbells in front of your thighs and knees slightly bent.",
      "Push your hips back and keep the weights close to your legs.",
      "Stop at a comfortable stretch and stand tall by driving your hips forward.",
    ],
  },
  {
    id: "floor-press",
    name: "Dumbbell floor press",
    equipment: "Dumbbells",
    focus: "Chest",
    cues: [
      "Lie on your back, knees bent, with dumbbells over your chest.",
      "Lower until your upper arms lightly touch the floor.",
      "Press up smoothly, keeping your wrists above your elbows.",
    ],
  },
];

export const starters = [
  {
    id: "bodyweight-basics",
    name: "Bodyweight basics",
    equipment: "Stable counter",
    movements: [
      { id: "squat", sets: 2, reps: 8 },
      { id: "incline-push-up", sets: 2, reps: 6 },
      { id: "bridge", sets: 2, reps: 10 },
    ],
  },
  {
    id: "dumbbell-full-body",
    name: "Dumbbell full body",
    equipment: "Dumbbells",
    movements: [
      { id: "hinge", sets: 2, reps: 8 },
      { id: "floor-press", sets: 2, reps: 8 },
      { id: "row", sets: 2, reps: 8 },
    ],
  },
  {
    id: "dumbbell-upper-body",
    name: "Dumbbell upper body",
    equipment: "Dumbbells",
    movements: [
      { id: "floor-press", sets: 3, reps: 8 },
      { id: "row", sets: 3, reps: 8 },
    ],
  },
];

export async function catalogExercise(userId, movement) {
  const existing = await db
    .prepare(
      "SELECT id FROM exercises WHERE user_id=? AND name=? COLLATE NOCASE ORDER BY rowid LIMIT 1",
    )
    .get(userId, movement.name);
  if (existing) return existing.id;

  const categoryName = "Starter movements";
  await db
    .prepare("INSERT OR IGNORE INTO categories(id,user_id,name) VALUES(?,?,?)")
    .run(randomUUID(), userId, categoryName);
  const category = await db
    .prepare("SELECT id,name FROM categories WHERE user_id=? AND name=?")
    .get(userId, categoryName);
  const id = randomUUID();
  await db
    .prepare(
      "INSERT INTO exercises(id,user_id,name,category,notes,category_id) VALUES(?,?,?,?,?,?)",
    )
    .run(
      id,
      userId,
      movement.name,
      category.name,
      movement.cues.join("\n"),
      category.id,
    );
  return id;
}

export function starterCatalogRoutes(app) {
  app.get("/api/starter-catalog", (_req, res) =>
    res.json({ movements, starters }),
  );
  app.post(
    "/api/starter-catalog/movements/:id",
    handler(async (req, res) => {
      const movement = movements.find((entry) => entry.id === req.params.id);
      if (!movement)
        return res.status(404).json({ error: "Movement not found." });
      const id = await db.transaction(() =>
        catalogExercise(req.userId, movement),
      );
      res.json({ id });
    }),
  );
}
