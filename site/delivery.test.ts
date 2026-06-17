import { expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { build, createServer, preview } from "vite";
import { publicFiles } from "./site-content.ts";

const root = fileURLToPath(new URL(".", import.meta.url));

test("development and production serve every source link as the actual file", async () => {
  const outDir = await mkdtemp(join(tmpdir(), "dotagent-site-"));
  const files = await publicFiles();
  const dev = await createServer({
    root,
    envDir: false,
    logLevel: "silent",
    server: { host: "127.0.0.1", port: 0 },
  });
  let built: Awaited<ReturnType<typeof preview>> | undefined;
  try {
    await dev.listen();
    await build({ root, envDir: false, logLevel: "silent", build: { outDir, emptyOutDir: false } });
    built = await preview({
      root,
      envDir: false,
      logLevel: "silent",
      build: { outDir },
      preview: { host: "127.0.0.1", port: 0 },
    });
    for (const server of [dev, built]) {
      const address = server.httpServer?.address();
      if (!address || typeof address === "string") throw new Error("Missing preview address");
      const origin = `http://127.0.0.1:${address.port}`;
      const page = await (await fetch(origin)).text();
      expect(page.match(/class="skill-row"/g)).toHaveLength(16);
      expect(page).toContain("curl -fsSL https://dotagent.dev/install | sh");
      expect(page).not.toContain("--source");
      expect(page).not.toContain("<!--skill-rows-->");
      for (const [path, source] of files) {
        const response = await fetch(`${origin}/${path}`);
        expect(response.status, `${origin}/${path}`).toBe(200);
        expect(response.headers.get("content-type")).not.toContain("text/html");
        expect(Buffer.from(await response.arrayBuffer()).equals(await readFile(source))).toBe(true);
      }
      // Check every local navigation target, not just the links in the file map.
      for (const [, path] of page.matchAll(/(?:href|src)="\.\/([^"]+)"/g)) {
        expect((await fetch(`${origin}/${path}`)).status, path).toBe(200);
      }
    }
  } finally {
    if (built) await built.close();
    await dev.close();
    await rm(outDir, { recursive: true, force: true });
  }
}, 30_000);
