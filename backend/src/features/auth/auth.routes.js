import { availableHandle } from "./handles.js";
import { issueRecoveryCode } from "./recovery.js";
import { onboardingRoutes } from "./onboarding.routes.js";
import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { credentialsSchema, registrationSchema } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { createSession, publicUser } from "./sessions.js";
export function authRoutes(app) {
  const limit = rateLimit({ windowMs: 900000, limit: 30 });
  onboardingRoutes(app, limit, rateLimit({ windowMs: 60000, limit: 60 }));
  app.post(
    "/api/auth/register",
    limit,
    handler((req, res) => {
      const account = registrationSchema.parse(req.body);
      if (db.prepare("SELECT id FROM users WHERE email=?").get(account.email)) {
        return res.status(409).json({
          error:
            "This email already has an account. Sign in with its password.",
        });
      }
      const id = randomUUID();
      const username = availableHandle(account.username);
      if (db.prepare("SELECT id FROM users WHERE username=?").get(username))
        return res
          .status(409)
          .json({ error: "That public handle is taken. Choose another one." });
      db.prepare(
        "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
      ).run(
        id,
        username,
        hashPassword(account.password),
        account.age,
        account.weight,
        account.sex,
        account.email,
      );
      const recovery_code = issueRecoveryCode(id);
      res.set("Cache-Control", "no-store");
      createSession(res, id);
      res.status(201).json({
        ...publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)),
        recovery_code,
      });
    }),
  );
  app.post(
    "/api/auth/login",
    limit,
    handler((req, res) => {
      const credentials = credentialsSchema.parse(req.body);
      const user = db
        .prepare("SELECT * FROM users WHERE email=?")
        .get(credentials.email);
      if (!verifyPassword(credentials.password, user?.password))
        return res
          .status(401)
          .json({ error: "Email or password is incorrect." });
      createSession(res, user.id);
      res.json(publicUser(user));
    }),
  );
}
