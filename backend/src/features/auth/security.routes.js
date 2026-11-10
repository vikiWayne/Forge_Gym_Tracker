import { z } from "zod";
import rateLimit from "express-rate-limit";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { credentialsSchema, passwordSchema } from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { issueRecoveryCode, verifyRecovery } from "./recovery.js";
const limit = () => rateLimit({ windowMs: 900000, limit: 10 });
export function passwordResetRoutes(app) {
  app.post(
    "/api/auth/reset-password",
    limit(),
    handler((req, res) => {
      res.set("Cache-Control", "no-store");
      const data = z
        .object({
          email: credentialsSchema.shape.email,
          recovery_code: z.string().min(8).max(128),
          new_password: passwordSchema,
        })
        .parse(req.body);
      const user = db
        .prepare(
          "SELECT u.*,s.recovery_hash FROM users u LEFT JOIN account_security s ON s.user_id=u.id WHERE u.email=?",
        )
        .get(data.email);
      if (!verifyRecovery(data.recovery_code, user?.recovery_hash))
        return res.status(400).json({
          error:
            "The email and recovery code don’t match, or this code has already been used. Check your saved code and try again.",
        });
      db.exec("BEGIN");
      try {
        db.prepare("UPDATE users SET password=? WHERE id=?").run(
          hashPassword(data.new_password),
          user.id,
        );
        db.prepare(
          "UPDATE account_security SET recovery_hash=NULL WHERE user_id=?",
        ).run(user.id);
        db.prepare("DELETE FROM sessions WHERE user_id=?").run(user.id);
        db.prepare(
          "DELETE FROM onboarding_drafts WHERE email=? COLLATE NOCASE",
        ).run(user.email);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.clearCookie("session", { path: "/" });
      res.json({ ok: true });
    }),
  );
}
export function securityRoutes(app) {
  app.get("/api/me/security", (req, res) => {
    res.set("Cache-Control", "no-store");
    res.json({
      has_recovery_code: !!db
        .prepare("SELECT recovery_hash FROM account_security WHERE user_id=?")
        .get(req.userId)?.recovery_hash,
    });
  });
  app.post(
    "/api/me/recovery-code",
    limit(),
    handler((req, res) => {
      res.set("Cache-Control", "no-store");
      const { current_password } = z
        .object({ current_password: passwordSchema })
        .parse(req.body);
      const user = db
        .prepare("SELECT password FROM users WHERE id=?")
        .get(req.userId);
      if (!verifyPassword(current_password, user.password))
        return res
          .status(400)
          .json({ error: "Your current password is incorrect." });
      res.json({ recovery_code: issueRecoveryCode(req.userId) });
    }),
  );
  app.post(
    "/api/me/password",
    limit(),
    handler((req, res) => {
      const data = z
        .object({
          current_password: passwordSchema,
          new_password: passwordSchema,
        })
        .refine(
          (value) => value.current_password !== value.new_password,
          "Choose a password different from your current password.",
        )
        .parse(req.body);
      const user = db.prepare("SELECT * FROM users WHERE id=?").get(req.userId);
      if (!verifyPassword(data.current_password, user.password))
        return res
          .status(400)
          .json({ error: "Your current password is incorrect." });
      db.exec("BEGIN");
      try {
        db.prepare("UPDATE users SET password=? WHERE id=?").run(
          hashPassword(data.new_password),
          req.userId,
        );
        db.prepare(
          "UPDATE account_security SET recovery_hash=NULL WHERE user_id=?",
        ).run(req.userId);
        db.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?").run(
          req.userId,
          req.token,
        );
        db.prepare(
          "DELETE FROM onboarding_drafts WHERE email=? COLLATE NOCASE",
        ).run(user.email);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.json({ ok: true });
    }),
  );
}
