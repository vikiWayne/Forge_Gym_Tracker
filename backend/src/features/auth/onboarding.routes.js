import { issueRecoveryCode } from "./recovery.js";
import { randomBytes, randomUUID } from "node:crypto";
import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import {
  credentialsSchema,
  profileSchema,
  usernameSchema,
} from "./auth.schemas.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { createSession, publicUser } from "./sessions.js";
const cookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: process.env.NODE_ENV === "production",
  path: "/api/auth",
};
function tokenFrom(req) {
  return (
    req.headers.cookie
      ?.split(/;\s*/)
      .find((cookie) => cookie.startsWith("onboarding="))
      ?.slice(11) || ""
  );
}
function draftFrom(req) {
  return db
    .prepare("SELECT * FROM onboarding_drafts WHERE token=? AND expires>?")
    .get(tokenFrom(req), Date.now());
}
function clearDraft(req, res) {
  db.prepare("DELETE FROM onboarding_drafts WHERE token=?").run(tokenFrom(req));
  res.clearCookie("onboarding", cookieOptions);
}
export function onboardingRoutes(app, limit, availabilityLimit) {
  app.get(
    "/api/auth/username-availability",
    availabilityLimit,
    handler((req, res) => {
      res.set("Cache-Control", "no-store");
      const username = usernameSchema.parse(req.query.username);
      res.json({
        available: !db
          .prepare("SELECT id FROM users WHERE username=?")
          .get(username),
      });
    }),
  );
  app.post(
    "/api/auth/continue",
    limit,
    handler((req, res) => {
      const credentials = credentialsSchema.parse(req.body);
      const user = db
        .prepare("SELECT * FROM users WHERE username=?")
        .get(credentials.username);
      if (user) {
        if (!verifyPassword(credentials.password, user.password))
          return res.status(401).json({
            error:
              "That username already has an account. The password doesn’t match — try again.",
          });
        clearDraft(req, res);
        createSession(res, user.id);
        return res.json({ status: "authenticated", user: publicUser(user) });
      }
      clearDraft(req, res);
      db.prepare("DELETE FROM onboarding_drafts WHERE expires<=?").run(
        Date.now(),
      );
      const token = randomBytes(32).toString("hex");
      db.prepare("INSERT INTO onboarding_drafts VALUES(?,?,?,?)").run(
        token,
        credentials.username,
        hashPassword(credentials.password),
        Date.now() + 900000,
      );
      res.cookie("onboarding", token, { ...cookieOptions, maxAge: 900000 });
      res.json({ status: "onboarding", username: credentials.username });
    }),
  );
  app.get(
    "/api/auth/onboarding",
    handler((req, res) => {
      res.set("Cache-Control", "no-store");
      res.json({ username: draftFrom(req)?.username || null });
    }),
  );
  app.delete(
    "/api/auth/onboarding",
    handler((req, res) => {
      clearDraft(req, res);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/auth/onboarding",
    limit,
    handler((req, res) => {
      const profile = profileSchema.parse(req.body);
      const draft = draftFrom(req);
      if (!draft)
        return res.status(410).json({
          error:
            "Your setup session expired. Enter your username and password again to restart.",
        });
      if (
        db.prepare("SELECT id FROM users WHERE username=?").get(draft.username)
      )
        return res.status(409).json({
          error:
            "That username was just taken. Go back and choose another name, or use the existing account’s password.",
        });
      const id = randomUUID();
      let recovery_code;
      db.exec("BEGIN");
      try {
        db.prepare("INSERT INTO users VALUES(?,?,?,?,?,?)").run(
          id,
          draft.username,
          draft.password_hash,
          profile.age,
          profile.weight,
          profile.sex,
        );
        db.prepare("DELETE FROM onboarding_drafts WHERE token=?").run(
          draft.token,
        );
        recovery_code = issueRecoveryCode(id);
        db.exec("COMMIT");
      } catch (error) {
        db.exec("ROLLBACK");
        throw error;
      }
      res.set("Cache-Control", "no-store");
      res.clearCookie("onboarding", cookieOptions);
      createSession(res, id);
      res
        .status(201)
        .json({
          ...publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(id)),
          recovery_code,
        });
    }),
  );
}
