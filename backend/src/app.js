import { fileURLToPath } from "node:url";
import path from "node:path";
import { db } from "./database/connection.js";
import { workoutCsvRoutes } from "./features/workouts/workoutCsv.routes.js";
import { trackingRoutes } from "./features/tracking/tracking.routes.js";
import {
  passwordResetRoutes,
  securityRoutes,
} from "./features/auth/security.routes.js";
import { categoryRoutes } from "./features/categories/categories.routes.js";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { authRoutes } from "./features/auth/auth.routes.js";
import { profileRoutes } from "./features/profile/profile.routes.js";
import { exerciseRoutes } from "./features/exercises/exercises.routes.js";
import { workoutRoutes } from "./features/workouts/workouts.routes.js";
import { trainingRoutes } from "./features/workouts/training.routes.js";
import { planRoutes } from "./features/plans/plans.routes.js";
import { authenticate } from "./middleware/authenticate.js";
import { checkOrigin } from "./middleware/checkOrigin.js";
import { errorHandler } from "./middleware/errorHandler.js";
export const app = express();
if (process.env.TRUST_PROXY === "1") app.set("trust proxy", 1);
app.use(helmet());
app.use(express.json({ limit: "32kb" }));
app.use("/api", checkOrigin, rateLimit({ windowMs: 60000, limit: 180 }));
app.get("/api/health", (req, res) => {
  db.prepare("SELECT 1").get();
  res.set("Cache-Control", "no-store").json({ status: "ok" });
});
authRoutes(app);
passwordResetRoutes(app);
app.use("/api", authenticate);
profileRoutes(app);
securityRoutes(app);
trackingRoutes(app);
workoutCsvRoutes(app);
categoryRoutes(app);
exerciseRoutes(app);
workoutRoutes(app);
trainingRoutes(app);
planRoutes(app);
app.use("/api", (req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
if (process.env.SERVE_FRONTEND === "1") {
  const frontend = fileURLToPath(
    new URL("../../frontend/dist/", import.meta.url),
  );
  app.use(
    "/assets",
    express.static(path.join(frontend, "assets"), {
      immutable: true,
      maxAge: "1y",
      fallthrough: false,
    }),
  );
  app.use(express.static(frontend, { maxAge: 0 }));
  app.get("*", (req, res) => {
    res
      .set("Cache-Control", "no-cache")
      .sendFile(path.join(frontend, "index.html"));
  });
}
app.use(errorHandler);
