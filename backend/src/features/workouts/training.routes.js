import { handler } from "../../shared/handler.js";
import { withSets } from "./serialize.js";
import { db } from "../../database/connection.js";
export function trainingRoutes(app) {
  app.get(
    "/api/data",
    handler(async (req, res) =>
      res.json({
        categories: await db
          .prepare("SELECT * FROM categories WHERE user_id=? ORDER BY name")
          .all(req.userId),
        exercises: await db
          .prepare("SELECT * FROM exercises WHERE user_id=?")
          .all(req.userId),
        logs: await withSets(
          await db
            .prepare("SELECT * FROM logs WHERE user_id=? ORDER BY date DESC")
            .all(req.userId),
        ),
      }),
    ),
  );
}
