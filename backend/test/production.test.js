import { test, after } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

process.env.DB_PATH = ":memory:";
process.env.NODE_ENV = "production";
process.env.SERVE_FRONTEND = "1";
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}`;

test("health is public; private and unknown API routes retain JSON responses", async () => {
  const health = await fetch(base + "/api/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.equal(health.headers.get("cache-control"), "no-store");
  const privateRoute = await fetch(base + "/api/me");
  assert.equal(privateRoute.status, 401);
  assert.match(privateRoute.headers.get("content-type"), /json/);
  const unknown = await fetch(base + "/api/not-a-route");
  assert.match(unknown.headers.get("content-type"), /json/);
});

const index = new URL("../../frontend/dist/index.html", import.meta.url);
test(
  "production serves SPA routes, immutable assets and asset 404s",
  {
    skip:
      !existsSync(index) && "Build the frontend to run production asset checks",
  },
  async () => {
    const page = await fetch(base + "/together/example-plan");
    assert.equal(page.status, 200);
    assert.match(await page.text(), /<div id="root">/);
    assert.equal(page.headers.get("cache-control"), "no-cache");
    const asset = readFileSync(index, "utf8").match(/src="([^"]+\.js)"/)[1];
    const response = await fetch(base + asset);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /immutable/);
    const missing = await fetch(base + "/assets/missing.js");
    assert.equal(missing.status, 404);
    const data = await fetch(base + "/backend/data/forge.sqlite");
    assert.match(data.headers.get("content-type"), /text\/html/);
  },
);
