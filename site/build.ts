import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));
const modeIndex = process.argv.indexOf("--mode");
await build({
  root,
  mode: modeIndex === -1 ? "production" : process.argv[modeIndex + 1],
  // Only Vite's generated directory is replaced, never source files.
  build: { outDir: "dist", emptyOutDir: true },
});
for (const name of ["_headers", "_redirects", "CNAME"]) {
  await copyFile(`${root}${name}`, `${root}dist/${name}`);
}
