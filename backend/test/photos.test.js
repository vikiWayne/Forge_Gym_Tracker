import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import express from "express";
process.env.DB_PATH = ":memory:";
const { db } = await import("../src/database/connection.js");
const { photosRoutes } =
  await import("../src/features/photos/photos.routes.js");
const { errorHandler } = await import("../src/middleware/errorHandler.js");
const owner = randomUUID(),
  other = randomUUID();
for (const id of [owner, other])
  await db
    .prepare(
      "INSERT INTO users(id,username,password,age,weight,sex,email) VALUES(?,?,?,?,?,?,?)",
    )
    .run(id, id, "unused", 30, 70, "Other", `${id}@example.com`);
const app = express();
app.use(express.json({ limit: "128kb" }));
app.use((req, res, next) => {
  if (!req.headers["x-test-user"])
    return res.status(401).json({ error: "Sign in" });
  req.userId = req.headers["x-test-user"];
  next();
});
await photosRoutes(app);
app.use(errorHandler);
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api/photos`;
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+lmS8AAAAASUVORK5CYII=",
  "base64",
);
async function request(
  path = "",
  method = "GET",
  body,
  user = owner,
  type = "image/png",
) {
  return fetch(base + path, {
    method,
    headers: {
      ...(user ? { "x-test-user": user } : {}),
      ...(body ? { "content-type": type } : {}),
    },
    body,
  });
}
test("progress photos remain private, validate upload formats/dates/size, and delete only owned images", async () => {
  assert.equal((await request("", "GET", undefined, null)).status, 401);
  const uploaded = await request(
    "?date=2026-11-06&caption=My%20progress",
    "POST",
    png,
  );
  assert.equal(uploaded.status, 201);
  const { id } = await uploaded.json();
  const list = await request();
  assert.equal(list.headers.get("cache-control"), "no-store");
  const metadata = (await list.json()).photos;
  assert.equal(metadata.length, 1);
  assert.equal(metadata[0].caption, "My progress");
  assert.equal(metadata[0].bytes, undefined);
  assert.deepEqual(
    (await (await request("", "GET", undefined, other)).json()).photos,
    [],
  );
  const image = await request(`/${id}/image`);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get("content-type"), "image/png");
  assert.match(image.headers.get("cache-control"), /no-store/);
  assert.equal(image.headers.get("x-content-type-options"), "nosniff");
  assert.deepEqual(Buffer.from(await image.arrayBuffer()), png);
  assert.equal(
    (await request(`/${id}/image`, "GET", undefined, other)).status,
    404,
  );
  assert.equal(
    (await request(`/${id}/image`, "GET", undefined, null)).status,
    401,
  );
  assert.equal((await request("?date=2026-02-30", "POST", png)).status, 400);
  assert.equal((await request("?date=2099-01-01", "POST", png)).status, 400);
  assert.equal(
    (
      await request(
        "?date=2026-11-06",
        "POST",
        Buffer.from("<svg></svg>"),
        owner,
        "image/svg+xml",
      )
    ).status,
    400,
  );
  assert.equal(
    (await request("?date=2026-11-06", "POST", png, owner, "image/jpeg"))
      .status,
    400,
  );
  assert.equal(
    (
      await request(
        "?date=2026-11-06",
        "POST",
        Buffer.alloc(2 * 1024 * 1024 + 1),
      )
    ).status,
    413,
  );
  assert.equal(
    (await request(`/${id}`, "DELETE", undefined, other)).status,
    404,
  );
  assert.equal((await request(`/${id}`, "DELETE")).status, 200);
  assert.equal((await request(`/${id}/image`)).status, 404);
  assert.equal(
    (await db.prepare("SELECT COUNT(*) AS count FROM progress_photos").get())
      .count,
    0,
  );
});
test("private photo captions can travel in headers instead of URL query strings", async () => {
  const caption = "Morning progress — calm";
  const response = await fetch(base, {
    method: "POST",
    headers: {
      "x-test-user": owner,
      "content-type": "image/png",
      "x-photo-date": "2026-11-06",
      "x-photo-caption": encodeURIComponent(caption),
    },
    body: png,
  });
  assert.equal(response.status, 201);
  const { id } = await response.json();
  const list = (await (await request()).json()).photos;
  assert.equal(list.find((photo) => photo.id === id).caption, caption);
  await request(`/${id}`, "DELETE");
  assert.equal(
    (
      await fetch(base, {
        method: "POST",
        headers: {
          "x-test-user": owner,
          "content-type": "image/png",
          "x-photo-date": "2026-11-06",
          "x-photo-caption": "%invalid",
        },
        body: png,
      })
    ).status,
    400,
  );
});
