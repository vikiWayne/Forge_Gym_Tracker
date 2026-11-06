import { db } from "../database/connection.js";
export function authenticate(req, res, next) {
  const token = req.headers.cookie
    ?.split(/;\s*/)
    .find((cookie) => cookie.startsWith("session="))
    ?.slice(8);
  const session = db
    .prepare("SELECT * FROM sessions WHERE token=? AND expires>?")
    .get(token || "", Date.now());
  if (!session)
    return res.status(401).json({ error: "Please sign in to continue." });
  req.userId = session.user_id;
  req.token = token;
  next();
}
