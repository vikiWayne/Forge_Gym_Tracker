import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { offlineShell } from "./src/features/pwa/build-plugin.mjs";
import { productionApiOrigin } from "./api.config.mjs";
import { nativeApiUrl } from "./src/shared/api/nativeApiUrl";

export default defineConfig(({ command, mode }) => {
  const native = mode === "native" || mode === "native-local";
  let apiOrigin = "";
  if (command === "build") {
    if (["production", "pages", "native"].includes(mode)) {
      apiOrigin = productionApiOrigin;
    } else if (mode === "native-local") {
      const configured = loadEnv(
        mode,
        process.cwd(),
        "VITE_",
      ).VITE_LOCAL_API_ORIGIN;
      const localOrigin = new URL(nativeApiUrl("/api/health", configured))
        .origin;
      if (localOrigin === productionApiOrigin)
        throw new Error(
          "VITE_LOCAL_API_ORIGIN must point to your local backend.",
        );
      apiOrigin = localOrigin;
    }
  }
  return {
    define: { "import.meta.env.VITE_API_ORIGIN": JSON.stringify(apiOrigin) },
    plugins: [react(), ...(native ? [] : [offlineShell()])],
    base: mode === "pages" ? "/Forge_Gym_Tracker/" : "/",
    build: {
      outDir: native ? "dist-native" : "dist",
      rollupOptions: {
        output: {
          manualChunks: { charts: ["recharts"] },
        },
      },
    },
    server: { port: 5173, proxy: { "/api": "http://127.0.0.1:3001" } },
  };
});
