import { availableHandle } from "./handles.js";
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
async function draftFrom(req) {
  return await db
    .prepare("SELECT * FROM onboarding_drafts WHERE token=? AND expires>?")
    .get(tokenFrom(req), Date.now());
}
async function clearDraft(req, res) {
  await db
    .prepare("DELETE FROM onboarding_drafts WHERE token=?")
    .run(tokenFrom(req));
  res.clearCookie("onboarding", cookieOptions);
}
export function onboardingRoutes(app, limit, availabilityLimit) {
  app.get(
    "/api/auth/username-availability",
    availabilityLimit,
    handler(async (req, res) => {
      res.set("Cache-Control", "no-store");
      const username = usernameSchema.parse(req.query.username);
      res.json({
        available: !(await db
          .prepare("SELECT id FROM users WHERE username=?")
          .get(username)),
      });
    }),
  );
  app.post(
    "/api/auth/continue",
    limit,
    handler(async (req, res) => {
      const credentials = credentialsSchema
        .extend({ username: usernameSchema.optional() })
        .parse(req.body);
      const user = await db
        .prepare("SELECT * FROM users WHERE email=?")
        .get(credentials.email);
      if (user) {
        if (!verifyPassword(credentials.password, user.password))
          return res.status(401).json({
            error:
              "That email already has an account. The password doesn’t match — try again.",
          });
        await clearDraft(req, res);
        await createSession(res, user.id);
        return res.json({ status: "authenticated", user: publicUser(user) });
      }
      await clearDraft(req, res);
      await db
        .prepare("DELETE FROM onboarding_drafts WHERE expires<=?")
        .run(Date.now());
      const token = randomBytes(32).toString("hex");
      await db
        .prepare(
          "INSERT INTO onboarding_drafts(token,username,password_hash,expires,email) VALUES(?,?,?,?,?)",
        )
        .run(
          token,
          await availableHandle(credentials.username),
          hashPassword(credentials.password),
          Date.now() + 900000,
          credentials.email,
        );
      res.cookie("onboarding", token, { ...cookieOptions, maxAge: 900000 });
      res.json({ status: "onboarding", email: credentials.email });
    }),
  );
  app.get(
    "/api/auth/onboarding",
    handler(async (req, res) => {
      res.set("Cache-Control", "no-store");
      res.json({ email: (await draftFrom(req))?.email || null });
    }),
  );
  app.delete(
    "/api/auth/onboarding",
    handler(async (req, res) => {
      await clearDraft(req, res);
      res.json({ ok: true });
    }),
  );
  app.post(
    "/api/auth/onboarding",
    limit,
    handler(async (req, res) => {
      const profile = profileSchema.parse(req.body);
      const draft = await draftFrom(req);
      if (!draft)
        return res.status(410).json({
          error:
            "Your setup session expired. Enter your email and password again to restart.",
        });
      if (
        await db.prepare("SELECT id FROM users WHERE email=?").get(draft.email)
      )
        return res.status(409).json({
          error:
            "That email was just registered. Go back and sign in with the existing account’s password.",
        });
      if (
        await db
          .prepare("SELECT id FROM users WHERE username=?")
          .get(draft.username)
      ) {
        draft.username = await availableHandle();
      }
      const id = randomUUID();
      let recovery_code;
      await db.transaction(async () => {
        await db
          .prepare(
            "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
          )
          .run(
            id,
            draft.username,
            draft.password_hash,
            profile.age,
            profile.weight,
            profile.sex,
            draft.email,
          );
        await db
          .prepare("DELETE FROM onboarding_drafts WHERE token=?")
          .run(draft.token);
        recovery_code = await issueRecoveryCode(id);
      });
      res.set("Cache-Control", "no-store");
      res.clearCookie("onboarding", cookieOptions);
      await createSession(res, id);
      res.status(201).json({
        ...publicUser(
          await db.prepare("SELECT * FROM users WHERE id=?").get(id),
        ),
        recovery_code,
      });
    }),
  );
}
