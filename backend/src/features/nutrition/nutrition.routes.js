import { z } from "zod";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { decimalNumber } from "../../shared/validation.js";

export function nutritionDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
export function nutritionRoutes(app) {
  db.exec(`CREATE TABLE IF NOT EXISTS nutrition_targets(
    user_id TEXT PRIMARY KEY REFERENCES users(id),protein_grams REAL NOT NULL CHECK(protein_grams BETWEEN 1 AND 1000)
  )`);
  function summary(userId) {
    const date = nutritionDate();
    const target =
      db
        .prepare("SELECT protein_grams FROM nutrition_targets WHERE user_id=?")
        .get(userId)?.protein_grams ?? null;
    const total = db
      .prepare(
        "SELECT COALESCE(SUM(value),0) AS total FROM protein_entries WHERE user_id=? AND date=?",
      )
      .get(userId, date).total;
    const logged = Number(Number(total).toFixed(2));
    return {
      date,
      target,
      logged,
      remaining:
        target === null
          ? null
          : Number(Math.max(0, target - logged).toFixed(2)),
    };
  }
  app.get("/api/nutrition/target", (req, res) =>
    res.set("Cache-Control", "no-store").json(summary(req.userId)),
  );
  app.put(
    "/api/nutrition/target",
    handler((req, res) => {
      const { target } = z
        .object({ target: decimalNumber(1, 1000) })
        .parse(req.body);
      db.prepare(
        "INSERT INTO nutrition_targets(user_id,protein_grams) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET protein_grams=excluded.protein_grams",
      ).run(req.userId, target);
      res.set("Cache-Control", "no-store").json(summary(req.userId));
    }),
  );
  app.delete("/api/nutrition/target", (req, res) => {
    db.prepare("DELETE FROM nutrition_targets WHERE user_id=?").run(req.userId);
    res.set("Cache-Control", "no-store").json(summary(req.userId));
  });
}
