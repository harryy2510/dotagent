import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { type Plugin } from "vite-plus";

const repo = new URL("../", import.meta.url);

// An explicit public file map, not a server for arbitrary repository paths.
// The same map feeds Vite dev middleware and production build assets.
export async function publicFiles() {
  const files = new Map<string, URL>([
    ["install", new URL("install.sh", repo)],
    ["readme.md", new URL("README.md", repo)],
    ["pack/memory/fragments/dotagent.md", new URL(".agentsync/memory/fragments/dotagent.md", repo)],
  ]);
  async function addDirectory(directory: URL, prefix: string) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.name.startsWith(".")) continue;
      const source = new URL(entry.name, directory);
      if (entry.isDirectory()) {
        await addDirectory(new URL(`${entry.name}/`, directory), `${prefix}${entry.name}/`);
      } else if (entry.isFile() && /\.(md|png)$/.test(entry.name)) {
        files.set(`${prefix}${entry.name}`, source);
      }
    }
  }
  await addDirectory(new URL(".agentsync/skills/", repo), "pack/skills/");
  return files;
}

export function siteContent(): Plugin {
  return {
    name: "dotagent-public-source",
    async configureServer(server) {
      const files = await publicFiles();
      for (const source of files.values()) server.watcher.add(fileURLToPath(source));
      server.middlewares.use((req, res, next) => {
        const pathname = req.url?.split("?")[0]?.replace(/^\//, "") ?? "";
        const source = files.get(pathname);
        if (!source) {
          next();
          return;
        }
        if (req.method !== "GET" && req.method !== "HEAD") {
          res.statusCode = 405;
          res.end();
          return;
        }
        readFile(source)
          .then((content) => {
            res.setHeader(
              "Content-Type",
              pathname.endsWith(".png") ? "image/png" : "text/plain; charset=utf-8",
            );
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Cache-Control", "no-cache");
            res.end(req.method === "HEAD" ? undefined : content);
          })
          .catch(next);
      });
    },
    async generateBundle() {
      for (const [fileName, source] of await publicFiles()) {
        this.emitFile({ type: "asset", fileName, source: await readFile(source) });
      }
    },
  };
}
