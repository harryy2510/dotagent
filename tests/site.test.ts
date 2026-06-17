import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { publicFiles } from "../site/site-content";

const root = fileURLToPath(new URL("../", import.meta.url));
const html = readFileSync(`${root}site/index.html`, "utf8");
const readme = readFileSync(`${root}README.md`, "utf8");
const skills = readdirSync(`${root}.agentsync/skills`).filter((name) =>
  existsSync(`${root}.agentsync/skills/${name}/SKILL.md`),
);

describe("site content contracts", () => {
  test("the site and README list every shipped skill exactly once", () => {
    expect(skills).toHaveLength(16);
    for (const name of skills) {
      expect(html.split(`<code>${name}</code>`)).toHaveLength(2);
      expect(readme).toContain(`.agentsync/skills/${name}/SKILL.md`);
    }
    expect(html.match(/class="skill-row"/g)).toHaveLength(skills.length);
  });

  test("all internal navigation targets exist and IDs are unique", () => {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, id] of html.matchAll(/href="#([^"]+)"/g)) {
      expect(ids).toContain(id);
    }
  });

  test("README local links resolve", () => {
    for (const [, path] of readme.matchAll(/\]\(((?:\.agentsync|site|tests)[^)]+)\)/g)) {
      expect(existsSync(`${root}${path}`)).toBe(true);
    }
  });

  test("deployment calls the shared workflow with its required interface", () => {
    const workflow = readFileSync(`${root}.github/workflows/pages.yml`, "utf8");
    expect(workflow).toContain(
      "Utilities-Studio/infra/.github/workflows/cloudflare-pages-deploy.yml@main",
    );
    expect(workflow).toContain("working_directory: site");
    expect(workflow).toContain("build_output_directory: dist");
    expect(workflow).toContain("vars.CLOUDFLARE_ACCOUNT_ID");
    expect(workflow).toContain("secrets.CLOUDFLARE_API_TOKEN");
    expect(workflow).not.toContain("pull_request_target");
  });

  test("every local source link resolves to a real published file", async () => {
    const files = await publicFiles();
    const sourceLinks = [...html.matchAll(/href="\.\/([^"]+)"[^>]*data-source/g)];
    expect(sourceLinks.length).toBeGreaterThanOrEqual(20);
    for (const [, path] of sourceLinks) {
      expect(files.has(path!)).toBe(true);
      expect(existsSync(files.get(path!)!)).toBe(true);
    }
    expect(files.get("install")?.pathname).toBe(`${root}install.sh`);
    expect(readFileSync(`${root}site/_redirects`, "utf8")).not.toContain("githubusercontent");
    expect(readFileSync(`${root}site/_headers`, "utf8")).toContain("Content-Type: text/plain");
  });

  test("published sources exclude private files and include bundled skill references", async () => {
    const files = await publicFiles();
    expect(files.has("pack/skills/testing/references/testing-patterns.md")).toBe(true);
    expect(files.has("pack/skills/shadcn/assets/shadcn.png")).toBe(true);
    for (const path of files.keys()) {
      expect(path).not.toMatch(/(^|\/)\./);
      expect(path).not.toContain("agentsync.toml");
      expect(path).not.toContain(".state");
    }
  });

  test("plain HTML contains every skill and the normal install command", () => {
    expect(html).toContain("curl -fsSL https://dotagent.dev/install | sh");
    expect(html).not.toContain("--source");
    expect(html.match(/class="skill-row"/g)).toHaveLength(16);
    expect(html).not.toMatch(/class="skill-row"[^>]*\bhidden\b/);
    expect(html).not.toContain("<!--skill-rows-->");
    expect(html).not.toContain("<!--install-command-->");
    expect(readFileSync(`${root}site/site-content.ts`, "utf8")).not.toContain("transformIndexHtml");
  });

  test("all brand occurrences use the same asset", () => {
    const icons = [...html.matchAll(/(?:src|href)="([^"]*mark[^"]*)"/g)];
    expect(icons).toHaveLength(3);
    expect(new Set(icons.map((match) => match[1]))).toEqual(new Set(["./mark.png"]));
    expect(html).not.toContain("brand-orbit");
    expect(html).not.toContain("orbit-art");
    expect(html).not.toMatch(/github\.com\/harryy2510\/dotagent\/(?:tree|blob)\/main/);
  });

  test("production markup does not require inline scripts or third-party resources", () => {
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).not.toMatch(/\son(?:click|change|load)=/);
    expect(html).not.toMatch(/<(?:script|img)[^>]+src="https?:/);
    expect(html).not.toMatch(/<link\s+rel="(?:stylesheet|icon)"[^>]+href="https?:/);
    expect(html).toContain('id="copy-status"');
    expect(html).toContain('role="status"');
  });
});
