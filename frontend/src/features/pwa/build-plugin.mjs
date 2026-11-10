import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
export function offlineShell() {
  let base = "/";
  return {
    name: "forge-offline-shell",
    apply: "build",
    enforce: "post",
    configResolved(config) {
      base = config.base;
    },
    generateBundle(_, bundle) {
      const files = [
        "index.html",
        "manifest.webmanifest",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/forge.svg",
        ...Object.keys(bundle).filter((name) => /\.(js|css)$/.test(name)),
      ];
      const template = readFileSync(
        new URL("./service-worker.js", import.meta.url),
        "utf8",
      );
      const version = createHash("sha256")
        .update(
          JSON.stringify(files) +
            template +
            Object.values(bundle)
              .map((item) =>
                item.type === "chunk" ? item.code : String(item.source),
              )
              .join(""),
        )
        .update(readFileSync(new URL("../../../index.html", import.meta.url)))
        .digest("hex")
        .slice(0, 16);
      this.emitFile({
        type: "asset",
        fileName: "sw.js",
        source: template
          .replace("__FORGE_VERSION__", JSON.stringify(version))
          .replace("__FORGE_BASE__", JSON.stringify(base))
          .replace("__FORGE_FILES__", JSON.stringify(files)),
      });
    },
  };
}
