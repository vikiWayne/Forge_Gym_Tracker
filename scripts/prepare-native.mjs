import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const args = process.argv.slice(2);
if (args.length && (args.length !== 1 || args[0] !== "--local")) {
  console.error("Usage: npm run native:prepare -- [--local]");
  process.exit(1);
}
const mode = args.includes("--local") ? "native-local" : "native";

function run(args) {
  const result = spawnSync(
    process.execPath,
    [process.env.npm_execpath, ...args],
    { cwd: root, stdio: "inherit" },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}

run(["run", "build", "-w", "frontend", "--", "--mode", mode]);
run(["run", "native:sync", "-w", "frontend"]);
console.log("Web assets built and copied to Android and iOS.");
