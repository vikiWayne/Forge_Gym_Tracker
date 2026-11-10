import express from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "../../database/connection.js";
import { dateSchema } from "../../shared/validation.js";
import { handler } from "../../shared/handler.js";

function imageType(bytes) {
  if (!Buffer.isBuffer(bytes)) return null;
  if (
    bytes.length >= 33 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString("ascii", 12, 16) === "IHDR"
  ) {
    const width = bytes.readUInt32BE(16),
      height = bytes.readUInt32BE(20);
    if (width > 0 && height > 0 && width <= 10000 && height <= 10000)
      return "image/png";
  }
  if (
    bytes.length >= 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes[bytes.length - 2] === 255 &&
    bytes[bytes.length - 1] === 217
  )
    return "image/jpeg";
  if (
    bytes.length >= 20 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP" &&
    bytes.readUInt32LE(4) + 8 === bytes.length &&
    ["VP8 ", "VP8L", "VP8X"].includes(bytes.toString("ascii", 12, 16))
  )
    return "image/webp";
  return null;
}
export function photosRoutes(app) {
  db.exec(`CREATE TABLE IF NOT EXISTS progress_photos(
    id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),date TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',content_type TEXT NOT NULL,bytes BLOB NOT NULL,created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS photos_user_date ON progress_photos(user_id,date);`);
  app.get("/api/photos", (req, res) => {
    res.set("Cache-Control", "no-store").json({
      photos: db
        .prepare(
          "SELECT id,date,caption,content_type,created_at,length(bytes) AS size FROM progress_photos WHERE user_id=? ORDER BY date DESC,created_at DESC",
        )
        .all(req.userId),
    });
  });
  app.post(
    "/api/photos",
    express.raw({
      type: ["image/jpeg", "image/png", "image/webp"],
      limit: "2mb",
    }),
    handler((req, res) => {
      let captionHeader;
      try {
        captionHeader =
          req.get("x-photo-caption") === undefined
            ? undefined
            : decodeURIComponent(req.get("x-photo-caption"));
      } catch {
        return res.status(400).json({ error: "Invalid photo caption." });
      }
      const { date, caption } = z
        .object({
          date: dateSchema,
          caption: z.string().trim().max(500).default(""),
        })
        .parse({
          date: req.get("x-photo-date") || req.query.date,
          caption: captionHeader ?? req.query.caption,
        });
      const contentType = imageType(req.body);
      if (
        !contentType ||
        req.get("content-type")?.split(";")[0].trim().toLowerCase() !==
          contentType
      )
        return res.status(400).json({
          error: "Choose a valid JPEG, PNG or WebP image up to 2 MiB.",
        });
      const id = randomUUID();
      db.prepare(
        "INSERT INTO progress_photos(id,user_id,date,caption,content_type,bytes,created_at) VALUES(?,?,?,?,?,?,?)",
      ).run(id, req.userId, date, caption, contentType, req.body, Date.now());
      res.set("Cache-Control", "no-store").status(201).json({ id });
    }),
  );
  app.get("/api/photos/:id/image", (req, res) => {
    const photo = db
      .prepare(
        "SELECT content_type,bytes FROM progress_photos WHERE id=? AND user_id=?",
      )
      .get(req.params.id, req.userId);
    if (!photo) return res.status(404).json({ error: "Photo not found." });
    res
      .set({
        "Content-Type": photo.content_type,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Disposition": "inline",
      })
      .send(Buffer.from(photo.bytes));
  });
  app.delete("/api/photos/:id", (req, res) => {
    const result = db
      .prepare("DELETE FROM progress_photos WHERE id=? AND user_id=?")
      .run(req.params.id, req.userId);
    res
      .status(result.changes ? 200 : 404)
      .json({ ok: Boolean(result.changes) });
  });
}
