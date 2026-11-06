import { db } from "../../database/connection.js";
import { handler } from "../../shared/handler.js";
import { profileSchema, usernameSchema } from "../auth/auth.schemas.js";
import { publicUser } from "../auth/sessions.js";
export function profileRoutes(app) {
  app.get("/api/me", (req, res) =>
    res.json(
      publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(req.userId)),
    ),
  );
  app.put(
    "/api/me",
    handler((req, res) => {
      const d = profileSchema.parse(req.body);
      db.prepare("UPDATE users SET age=?,weight=?,sex=? WHERE id=?").run(
        d.age,
        d.weight,
        d.sex,
        req.userId,
      );
      res.json(
        publicUser(
          db.prepare("SELECT * FROM users WHERE id=?").get(req.userId),
        ),
      );
    }),
  );
  app.get(
    "/api/me/username-availability",
    handler((req, res) => {
      res.set("Cache-Control", "no-store");
      const username = usernameSchema.parse(req.query.username);
      res.json({
        available: !db
          .prepare("SELECT id FROM users WHERE username=? AND id<>?")
          .get(username, req.userId),
      });
    }),
  );
  app.put(
    "/api/me/username",
    handler((req, res) => {
      const username = usernameSchema.parse(req.body.username);
      if (
        db
          .prepare("SELECT id FROM users WHERE username=? AND id<>?")
          .get(username, req.userId)
      )
        return res
          .status(409)
          .json({ error: "That username is already taken. Try another one." });
      db.prepare("UPDATE users SET username=? WHERE id=?").run(
        username,
        req.userId,
      );
      res.json(
        publicUser(
          db.prepare("SELECT * FROM users WHERE id=?").get(req.userId),
        ),
      );
    }),
  );
  app.post("/api/auth/logout", (req, res) => {
    db.prepare("DELETE FROM sessions WHERE token=?").run(req.token);
    res.clearCookie("session");
    res.json({ ok: true });
  });
}
