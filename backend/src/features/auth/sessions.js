import { randomBytes } from "node:crypto";
import { db } from "../../database/connection.js";
export function createSession(response, userId) {
  const token = randomBytes(32).toString("hex");
  db.prepare("DELETE FROM sessions WHERE expires<=?").run(Date.now());
  db.prepare("INSERT INTO sessions VALUES(?,?,?)").run(
    token,
    userId,
    Date.now() + 604800000,
  );
  response.cookie("session", token, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 604800000,
    path: "/",
  });
}
export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    age: user.age,
    weight: user.weight,
    sex: user.sex,
  };
}
