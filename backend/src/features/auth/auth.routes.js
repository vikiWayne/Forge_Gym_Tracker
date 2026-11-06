import { randomUUID } from "node:crypto";
import rateLimit from "express-rate-limit";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { credentialsSchema, registrationSchema } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { createSession, publicUser } from "./sessions.js";
export function authRoutes(app) {
  const limit = rateLimit({ windowMs: 900000, limit: 30 });
  app.post(
    "/api/auth/register",
    limit,
    handler((req, res) => {
      const account = registrationSchema.parse(req.body);
      if (
        db
          .prepare("SELECT id FROM users WHERE username=?")
          .get(account.username)
      ) {
        return res
          .status(409)
          .json({
            error:
              "That username already has a training buddy! Choose another username, or sign in if this account is yours.",
          });
      }
      const id = randomUUID();
      db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
        id,
        account.username,
        hashPassword(account.password),
        account.age,
        account.weight,
        account.sex,
      );
      createSession(res, id);
      res
        .status(201)
        .json(publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)));
    }),
  );
  app.post(
    "/api/auth/login",
    limit,
    handler((req, res) => {
      const credentials = credentialsSchema.parse(req.body);
      const user = db
        .prepare("SELECT * FROM users WHERE username=?")
        .get(credentials.username);
      if (!verifyPassword(credentials.password, user?.password))
        return res
          .status(401)
          .json({ error: "Username or password is incorrect." });
      createSession(res, user.id);
      res.json(publicUser(user));
    }),
  );
}
