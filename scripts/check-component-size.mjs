import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
const root = new URL("../frontend/src/", import.meta.url);
async function inspect(directory) {
  const files = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(
    files.map(async (file) => {
      const path = join(directory, file.name);
      if (file.isDirectory()) return inspect(path);
      if (!file.name.endsWith(".tsx")) return [];
      const lines = (await readFile(path, "utf8")).trimEnd().split("\n").length;
      return [{ path, lines }];
    }),
  );
  return results.flat();
}
const components = await inspect(fileURLToPath(root));
const oversized = components.filter((file) => file.lines > 300);
if (oversized.length) {
  console.error("Components must stay at or below 300 lines:", oversized);
  process.exitCode = 1;
} else {
  const largest = components.reduce((a, b) => (a.lines > b.lines ? a : b));
  console.log(
    `${components.length} component files checked. Largest: ${largest.lines} lines (${largest.path.split("/src/")[1]}).`,
  );
}
