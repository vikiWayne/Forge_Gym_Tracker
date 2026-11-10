import { test, after } from "node:test";
import assert from "node:assert/strict";
process.env.DB_PATH = ":memory:";
const { app } = await import("../src/app.js");
const server = app.listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
after(() => server.close());
const base = `http://127.0.0.1:${server.address().port}/api`;
async function request(path, body, cookie) {
  const response = await fetch(base + path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, data: await response.json(), cookie: response.headers.getSetCookie().map((item) => item.split(";")[0]).join("; ") };
}
test("email sign-in is normalized, public handles stay separate, reset requires a recovery code", async () => {
  const created = await request("/auth/register", { email: " EMAIL.User@Example.COM ", password: "fresh-password", age: 30, weight: 70, sex: "Other" });
  assert.equal(created.status, 201);
  assert.equal(created.data.email, "email.user@example.com");
  assert.match(created.data.username, /^lifter_/);
  assert.ok(!created.data.username.includes("email.user"));
  assert.equal((await request("/auth/login", { username: created.data.username, password: "fresh-password" })).status, 400);
  const login = await request("/auth/login", { email: "EMAIL.USER@EXAMPLE.COM", password: "fresh-password" });
  assert.equal(login.status, 200);
  assert.equal(login.data.id, created.data.id);
  assert.equal((await request("/auth/register", { email: "email.user@example.com", password: "fresh-password", age: 30, weight: 70, sex: "Other" })).status, 409);
  assert.equal((await request("/auth/reset-password", { email: "email.user@example.com", new_password: "changed-password" })).status, 400);
  assert.equal((await request("/auth/reset-password", { email: "email.user@example.com", recovery_code: created.data.recovery_code, new_password: "changed-password" })).status, 200);
  assert.equal((await request("/me", undefined, login.cookie)).status, 401);
  assert.equal((await request("/auth/login", { email: "email.user@example.com", password: "changed-password" })).status, 200);
});
