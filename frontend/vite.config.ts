import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { offlineShell } from "./src/features/pwa/build-plugin.mjs";
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "native" ? [] : [offlineShell()])],
  base: mode === "pages" ? "/Forge_Gym_Tracker/" : "/",
  build: {
    outDir: mode === "native" ? "dist-native" : "dist",
    rollupOptions: {
      output: {
        manualChunks: { charts: ["recharts"] },
      },
    },
  },
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:3001" } },
}));
