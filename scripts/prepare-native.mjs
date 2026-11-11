import { loadEnv } from "vite";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { nativeApiOrigin } from "../frontend/native.config.mjs";
const root = fileURLToPath(new URL("../", import.meta.url));
const frontend = fileURLToPath(new URL("../frontend/", import.meta.url));
const value =
  process.env.VITE_NATIVE_API_URL ||
  loadEnv("native", frontend, "VITE_").VITE_NATIVE_API_URL ||
  nativeApiOrigin;
let origin;
try {
  origin = new URL(value);
} catch {}
if (
  !origin ||
  origin.protocol !== "https:" ||
  origin.username ||
  origin.password ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash
) {
  console.error(
    "Set VITE_NATIVE_API_URL to your HTTPS backend origin in frontend/.env.native.local first.",
  );
  process.exit(1);
}
function run(args) {
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, ...args],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, VITE_NATIVE_API_URL: origin.origin },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
run(["run", "build", "-w", "frontend", "--", "--mode", "native"]);
run(["run", "native:sync", "-w", "frontend"]);
if (origin.hostname.endsWith(".invalid"))
  console.log(
    "Placeholder API configured: replace frontend/native.config.mjs before signing in on a phone.",
  );
console.log(
  "Native web assets built and copied to Android and iOS. Open the platform project to build and sign.",
);
