import { handler } from "../../shared/handler.js";
import express from "express";
import {
  exportWorkouts,
  importWorkouts,
  initializeCsvImports,
  planImport,
} from "./workoutCsvService.js";
import { WorkoutCsvError } from "./workoutCsvFormat.js";
export async function workoutCsvRoutes(app) {
  await initializeCsvImports();
  app.get(
    "/api/workout-csv/export",
    handler(async (req, res) => {
      res.set({
        "Cache-Control": "no-store",
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="forge-workouts.csv"',
      });
      res.send(await exportWorkouts(req.userId));
    }),
  );
  const parse = express.text({ type: "text/csv", limit: "2mb" });
  for (const action of ["preview", "import"])
    app.post(
      `/api/workout-csv/${action}`,
      parse,
      handler(async (req, res, next) => {
        try {
          res.set("Cache-Control", "no-store");
          res.json(
            action === "preview"
              ? (await planImport(req.body, req.userId)).summary
              : await importWorkouts(req.body, req.userId),
          );
        } catch (error) {
          if (error instanceof WorkoutCsvError)
            return res.status(400).json({ error: error.message });
          next(error);
        }
      }),
    );
}
