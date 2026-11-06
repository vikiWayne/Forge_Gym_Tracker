import { withSets } from "./serialize.js";
import { db } from "../../database/connection.js";
export function trainingRoutes(app) {
  app.get("/api/data", (req, res) =>
    res.json({
      categories: db
        .prepare("SELECT * FROM categories WHERE user_id=? ORDER BY name")
        .all(req.userId),
      exercises: db
        .prepare("SELECT * FROM exercises WHERE user_id=?")
        .all(req.userId),
      logs: withSets(
        db
          .prepare("SELECT * FROM logs WHERE user_id=? ORDER BY date DESC")
          .all(req.userId),
      ),
    }),
  );
}
