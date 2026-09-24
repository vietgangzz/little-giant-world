import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "es2022",
    chunkSizeWarningLimit: 1200,
    // two routes: the tiny-planet story at / and the film at /nolan/
    rollupOptions: { input: { main: resolve(import.meta.dirname, "index.html"), nolan: resolve(import.meta.dirname, "nolan/index.html"), medieval: resolve(import.meta.dirname, "medieval/index.html") } },
  },
});
