import { defineConfig } from "vite";

// serve.py (PORT 8091 in dev) provides /worldstate.json (real news, BTC price, NYC weather) and /proxy (the in-game browser).
// The browser iframe talks to :8091 directly: a different origin from the game, so proxied pages can never touch the game's save.
export default defineConfig({
  server: { port: 8090, host: true, proxy: { "/worldstate.json": "http://localhost:8091" } },
  build: { outDir: "dist", chunkSizeWarningLimit: 1000 },
});
