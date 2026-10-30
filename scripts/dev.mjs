// npm run dev: the Python feed server (port 8091) + Vite with hot reload (port 8090)
import { spawn } from "node:child_process";
const run = (cmd, args, env = {}) => spawn(cmd, args, { stdio: "inherit", shell: true, env: { ...process.env, ...env } });
const api = run("python", ["serve.py"], { PORT: "8091" }), vite = run("npx", ["vite"]);
const stop = () => { api.kill(); vite.kill(); process.exit(); };
process.on("SIGINT", stop); process.on("SIGTERM", stop); vite.on("exit", stop);
