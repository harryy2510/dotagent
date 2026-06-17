import { afterEach, describe, expect, test } from "bun:test";
import {
  chmodSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const installer = resolve(import.meta.dir, "../install.sh");
const bun = process.execPath;
const roots: string[] = [];

// A real child-process boundary, but no network, package manager, native agent,
// or real HOME. The fake CLI enforces init's populated-directory refusal and
// requires the actual scope/registration/check/preview/apply command sequence.
const agentSyncMock = `#!${bun}
import { appendFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
appendFileSync(process.env.CALLS, JSON.stringify({ args, home: process.env.AGENTSYNC_HOME }) + "\\n");
const flag = name => { const i = args.indexOf(name); return i < 0 ? undefined : args[i+1]; };
if (!args.includes("--no-input")) throw Error("missing --no-input");
if (process.env.FAIL_COMMAND && args.slice(0,2).join(" ") === process.env.FAIL_COMMAND) {
  console.error("SECRET_FROM_INVALID_CONFIG"); process.exit(1);
}
if (process.env.FAIL_APPLY === "1" && args[0] === "apply" && !args.includes("--dry-run")) process.exit(1);
const root = flag("--project");
const home = root ? join(root, ".agentsync") : process.env.AGENTSYNC_HOME;
if (flag("--scope") === "project" && !root) throw Error("missing --project");
const config = join(home, "agentsync.toml");
if (args[0] === "init") {
  if (existsSync(home) && readdirSync(home).length) throw Error("init refuses populated home");
  mkdirSync(home, { recursive: true });
  writeFileSync(config, "# native scaffold\\n[agents]\\n");
  if (!root) writeFileSync(join(home, ".gitignore"), "# AgentSync local state\\n/.state/\\n");
  process.exit(0);
}
if (!existsSync(config)) throw Error("no agentsync.toml");
let text = readFileSync(config, "utf8");
const names = () => [...text.matchAll(/^([a-z][a-z0-9-]*) = \\{ enabled = (true|false).*\\}$/gm)];
if (args[0] === "agent") {
  const name = args[2];
  if (args[1] === "list") {
    for (const match of names()) console.log(match[1].padEnd(12) + " enabled=" + match[2]);
  } else if (["add", "enable"].includes(args[1])) {
    if (!["claude","codex","cursor","gemini","opencode","factory","copilot-cli"].includes(name)) process.exit(1);
    const entry = names().find(m => m[1] === name);
    if (!entry) text += name + " = { enabled = true }\\n";
    else if (args[1] === "enable") text = text.replace(entry[0], entry[0].replace("false","true"));
    writeFileSync(config, text);
  } else throw Error("unexpected agent command");
} else if (args[0] === "check") {
  if (!existsSync(join(home, "memory/fragments/dotagent.md"))) throw Error("pack not copied");
  console.log("check passed");
} else if (args[0] === "apply") {
  if (!names().some(m => m[2] === "true")) throw Error("no enabled agents");
  if (args.includes("--dry-run")) {
    console.log("Plan: 3 ops total across 1 agent(s) — 3 to write, 0 already synced");
    console.log("    → write  " + join(root || process.env.HOME, ".claude", "CLAUDE.md"));
  }
  else writeFileSync(join(root || process.env.HOME, "native-applied"), "applied");
} else throw Error("unexpected CLI command: " + args.join(" "));
`;

function put(path: string, text: string) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text);
}

function fixture(withAgentSync = true) {
  const root = realpathSync(mkdtempSync("/tmp/dotagent-test."));
  roots.push(root);
  const home = join(root, "home");
  const project = join(root, "project with spaces");
  const source = join(root, "source");
  const bin = join(root, "bin");
  for (const path of [home, project, bin]) mkdirSync(path);
  put(join(source, ".agentsync/memory/fragments/dotagent.md"), "# DotAgent fixture\n");
  put(
    join(source, ".agentsync/skills/testing/SKILL.md"),
    "---\nname: testing\ndescription: Test safely\n---\nTest.\n",
  );
  put(join(source, ".agentsync/skills/testing/scripts/run.sh"), "#!/bin/sh\nexit 0\n");
  chmodSync(join(source, ".agentsync/skills/testing/scripts/run.sh"), 0o755);
  put(
    join(source, ".agentsync/skills/testing/references/nested/example.md"),
    "bundled reference\n",
  );
  put(join(source, ".agentsync/hooks/ignored.toml"), "never copy\n");
  put(join(source, ".agentsync/mcp/ignored.toml"), "never copy\n");
  put(join(source, ".agentsync/memory/AGENTS.md"), "never copy\n");
  if (withAgentSync) {
    put(join(bin, "agentsync"), agentSyncMock);
    chmodSync(join(bin, "agentsync"), 0o755);
  }
  // Blocking mocks ensure a regression can never touch a real package manager.
  for (const command of ["curl", "brew", "go", "sudo", "dpkg", "rpm"]) {
    put(join(bin, command), `#!/bin/sh\nprintf '%s\\n' '${command}' >>"$DEPENDENCIES"\nexit 22\n`);
    chmodSync(join(bin, command), 0o755);
  }
  const env = {
    HOME: home,
    PATH: `${bin}:/usr/bin:/bin`,
    TMPDIR: join(root, "temp"),
    CALLS: join(root, "calls.jsonl"),
    DEPENDENCIES: join(root, "dependencies.log"),
    NO_COLOR: "1",
  };
  mkdirSync(env.TMPDIR);
  const calls = (): { args: string[]; home: string }[] =>
    existsSync(env.CALLS)
      ? readFileSync(env.CALLS, "utf8")
          .trim()
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
      : [];
  const run = (args: string[], extraEnv: Record<string, string> = {}) => {
    const result = Bun.spawnSync(["/bin/sh", installer, "--source", source, ...args], {
      cwd: project,
      env: { ...env, ...extraEnv },
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      timeout: 15_000,
    });
    return {
      status: result.exitCode,
      output: result.stdout.toString() + result.stderr.toString(),
    };
  };
  return { root, home, project, source, bin, env, run, calls };
}

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

describe("installer dependencies and process boundaries", () => {
  test("no controlling terminal fails immediately unless --yes or --dry-run", () => {
    const f = fixture();
    const result = spawnSync("/bin/sh", [installer, "--source", f.source, "--agents", "claude"], {
      cwd: f.project,
      env: f.env,
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 5_000,
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr.toString()).toContain("No interactive terminal");
    expect(f.calls()).toHaveLength(0);
    expect(readdirSync(f.home)).toHaveLength(0);
  });

  test("piped POSIX entrypoint does not consume its script as prompt input", () => {
    const f = fixture();
    const result = Bun.spawnSync(
      [
        "/bin/sh",
        "-c",
        'cat "$INSTALLER" | /bin/sh -s -- --source "$SOURCE" --project --agents claude --yes --no-apply',
      ],
      {
        cwd: f.project,
        env: { ...f.env, INSTALLER: installer, SOURCE: f.source },
        stdin: "ignore",
        stdout: "pipe",
        stderr: "pipe",
        timeout: 10_000,
      },
    );
    expect(result.exitCode).toBe(0);
    expect(existsSync(join(f.project, ".agentsync/skills/testing/SKILL.md"))).toBe(true);
  });

  test("normalized paths cannot evade source overlap or symlink guards", () => {
    const f = fixture();
    const result = f.run(["--yes", "--path", `${f.source}/./`, "--agents", "claude", "--force"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Source must be outside");
    expect(readFileSync(join(f.source, ".agentsync/memory/fragments/dotagent.md"), "utf8")).toBe(
      "# DotAgent fixture\n",
    );
    symlinkSync(f.source, join(f.root, "linked"));
    const traversal = f.run(["--yes", "--path", `${f.root}/linked/../safe`, "--agents", "claude"]);
    expect(traversal.status).not.toBe(0);
    expect(traversal.output).toContain("symlink");
  });

  test.each(["verified", "bad-checksum", "missing-checksum", "linked-archive"])(
    "portable binary download: %s",
    (scenario) => {
      const f = fixture(false);
      const downloads = join(f.root, "downloads");
      const payload = join(f.root, "payload");
      mkdirSync(downloads);
      mkdirSync(payload);
      put(join(payload, "agentsync"), agentSyncMock);
      if (scenario === "linked-archive") symlinkSync("/does-not-exist", join(payload, "linked"));
      const asset = "agentsync_1.2.3_linux_amd64.tar.gz";
      const tar = Bun.spawnSync(
        ["/usr/bin/tar", "-czf", join(downloads, asset), "-C", payload, "."],
        {
          env: { PATH: "/usr/bin:/bin", COPYFILE_DISABLE: "1" },
        },
      );
      expect(tar.exitCode).toBe(0);
      const checksum =
        scenario === "bad-checksum"
          ? "0".repeat(64)
          : new Bun.CryptoHasher("sha256")
              .update(readFileSync(join(downloads, asset)))
              .digest("hex");
      put(
        join(downloads, "checksums.txt"),
        `${checksum}  ${scenario === "missing-checksum" ? "other.tar.gz" : asset}\n`,
      );
      put(
        join(f.bin, "uname"),
        '#!/bin/sh\ncase "$1" in -s) echo Linux ;; -m) echo x86_64 ;; esac\n',
      );
      chmodSync(join(f.bin, "uname"), 0o755);
      put(
        join(f.bin, "curl"),
        `#!${bun}
import { copyFileSync, appendFileSync } from "node:fs";
import { join } from "node:path";
const args = process.argv.slice(2);
const url = args.find(arg => arg.startsWith("https://"));
appendFileSync(process.env.DEPENDENCIES, url + "\\n");
if (!url.startsWith("https://github.com/spxrogers/agentsync/releases/latest/download/")) process.exit(2);
copyFileSync(join(process.env.DOWNLOADS, url.split("/").at(-1)), args[args.indexOf("-o")+1]);
`,
      );
      chmodSync(join(f.bin, "curl"), 0o755);
      const result = f.run(["--yes", "--agents", "claude", "--method", "binary", "--no-apply"], {
        DOWNLOADS: downloads,
      });
      if (scenario === "verified") {
        expect(result.status, result.output).toBe(0);
        expect(result.output).toContain("Verified official AgentSync");
        expect(existsSync(join(f.home, ".local/bin/agentsync"))).toBe(true);
        expect(existsSync(join(f.home, ".agentsync/agentsync.toml"))).toBe(true);
        // A later run finds the user-local binary even when it isn't on PATH.
        expect(f.run(["--yes", "--no-apply"]).status).toBe(0);
      } else {
        expect(result.status).not.toBe(0);
        expect(existsSync(join(f.home, ".local/bin/agentsync"))).toBe(false);
        expect(existsSync(join(f.home, ".agentsync"))).toBe(false);
        expect(f.calls()).toHaveLength(0);
      }
    },
  );

  test.each(["brew", "go", "deb", "rpm"])(
    "dependency method %s uses its official command and never installs runtimes",
    (method) => {
      const f = fixture(false);
      const template = join(f.root, "mock-agentsync");
      put(template, agentSyncMock);
      const os = method === "brew" ? "Darwin" : "Linux";
      put(
        join(f.bin, "uname"),
        `#!/bin/sh\ncase "$1" in -s) echo ${os} ;; -m) echo x86_64 ;; esac\n`,
      );
      chmodSync(join(f.bin, "uname"), 0o755);
      if (method === "brew") {
        put(
          join(f.bin, "brew"),
          `#!/bin/sh
printf 'brew %s\\n' "$*" >>"$DEPENDENCIES"
if [ "$1" = install ]; then cp "$TEMPLATE" "$MOCK_BIN/agentsync"; chmod 755 "$MOCK_BIN/agentsync"; fi
`,
        );
        chmodSync(join(f.bin, "brew"), 0o755);
      } else if (method === "go") {
        put(
          join(f.bin, "go"),
          `#!/bin/sh
printf 'go %s toolchain=%s\\n' "$*" "$GOTOOLCHAIN" >>"$DEPENDENCIES"
cp "$TEMPLATE" "$GOBIN/agentsync"
chmod 755 "$GOBIN/agentsync"
`,
        );
        chmodSync(join(f.bin, "go"), 0o755);
      } else {
        put(join(f.bin, "id"), "#!/bin/sh\necho 1000\n");
        chmodSync(join(f.bin, "id"), 0o755);
        put(
          join(f.bin, "sudo"),
          `#!/bin/sh
[ "$1" = -n ] || exit 3
printf 'sudo %s\\n' "$*" >>"$DEPENDENCIES"
cp "$TEMPLATE" "$MOCK_BIN/agentsync"
chmod 755 "$MOCK_BIN/agentsync"
`,
        );
        chmodSync(join(f.bin, "sudo"), 0o755);
        const packageBytes = "verified fake package\n";
        const hash = new Bun.CryptoHasher("sha256").update(packageBytes).digest("hex");
        put(
          join(f.bin, "curl"),
          `#!${bun}
import { writeFileSync } from "node:fs";
const args = process.argv.slice(2);
const url = args.find(arg => arg.startsWith("https://"));
writeFileSync(args[args.indexOf("-o")+1], url.endsWith("checksums.txt")
  ? ${JSON.stringify(`${hash}  agentsync_linux_amd64.${method}\n`)}
  : ${JSON.stringify(packageBytes)});
`,
        );
        chmodSync(join(f.bin, "curl"), 0o755);
      }
      const result = f.run(["--yes", "--agents", "claude", "--method", method, "--no-apply"], {
        TEMPLATE: template,
        MOCK_BIN: f.bin,
      });
      expect(result.status).toBe(0);
      const calls = readFileSync(f.env.DEPENDENCIES, "utf8");
      if (method === "brew") expect(calls).toBe("brew tap spxrogers/tap\nbrew install agentsync\n");
      else if (method === "go")
        expect(calls).toBe(
          "go install github.com/spxrogers/agentsync/cmd/agentsync@latest toolchain=local\n",
        );
      else expect(calls).toContain(`sudo -n ${method === "deb" ? "dpkg" : "rpm"} -i `);
    },
  );
});

describe("guided POSIX installer", () => {
  test("fresh project: native init/add/list/check/preview/apply and complete skill bundles", () => {
    const f = fixture();
    const result = f.run([
      "--project",
      "--agents",
      "claude,codex,cursor,gemini,opencode,factory",
      "--yes",
    ]);
    expect(result.status).toBe(0);
    const dest = join(f.project, ".agentsync");
    expect(readFileSync(join(dest, "memory/fragments/dotagent.md"), "utf8")).toContain(
      "DotAgent fixture",
    );
    expect(readFileSync(join(dest, "skills/testing/references/nested/example.md"), "utf8")).toBe(
      "bundled reference\n",
    );
    expect(lstatSync(join(dest, "skills/testing/scripts/run.sh")).mode & 0o111).not.toBe(0);
    for (const path of ["hooks", "mcp", "memory/AGENTS.md"])
      expect(existsSync(join(dest, path))).toBe(false);
    expect(existsSync(join(f.project, "native-applied"))).toBe(true);
    expect(existsSync(join(f.home, "native-applied"))).toBe(false);
    const calls = f.calls();
    expect(calls.some((call) => call.args[0] === "init")).toBe(true);
    expect(calls.some((call) => call.args.slice(0, 2).join(" ") === "agent enable")).toBe(true);
    const checks = calls.filter((call) => ["check", "apply"].includes(call.args[0]!));
    expect(checks.map((call) => call.args.slice(0, 2))).toEqual([
      ["check", "--scope"],
      ["apply", "--dry-run"],
      ["apply", "--scope"],
    ]);
    expect(checks.every((call) => call.args.includes(f.project))).toBe(true);
    expect(result.output).toContain("[6/6]");
    expect(result.output).toContain(`write: ${join(f.project, ".claude", "CLAUDE.md")}`);
    expect(existsSync(f.env.DEPENDENCIES)).toBe(false);
    expect(existsSync(`${dest}.dotagent-lock`)).toBe(false);
  });

  test("fresh --yes defaults to user scope", () => {
    const f = fixture();
    const result = f.run(["--yes", "--agents", "claude"]);
    expect(result.status).toBe(0);
    expect(existsSync(join(f.home, ".agentsync/agentsync.toml"))).toBe(true);
    expect(existsSync(join(f.home, "native-applied"))).toBe(true);
    expect(existsSync(join(f.project, ".agentsync"))).toBe(false);
    expect(readFileSync(join(f.home, ".agentsync/.gitignore"), "utf8")).toBe(
      "# AgentSync local state\n/.state/\n",
    );
  });

  test.each(["user", "project"])(
    "%s setup protects user state without replacing existing ignore rules",
    (scope) => {
      const f = fixture();
      const ignore = join(f.home, ".agentsync/.gitignore");
      const original = "private.local\n!/.state/";
      put(ignore, original);
      const flags = [`--${scope}`, "--yes", "--agents", "claude", "--no-apply"];
      expect(f.run(flags).status).toBe(0);
      const protectedRules = readFileSync(ignore, "utf8");
      expect(protectedRules.startsWith(`${original}\n`)).toBe(true);
      expect(protectedRules.endsWith("\n/.state/\n")).toBe(true);
      expect(f.run(flags).status).toBe(0);
      expect(readFileSync(ignore, "utf8")).toBe(protectedRules);
    },
  );

  test("--path creates the requested project and respects AGENTSYNC_HOME", () => {
    const f = fixture();
    const project = join(f.root, "new", "nested project");
    const userHome = join(f.home, "custom", "canonical");
    const result = f.run(["--path", project, "--yes", "--agents", "factory"], {
      AGENTSYNC_HOME: userHome,
    });
    expect(result.status).toBe(0);
    expect(existsSync(join(project, ".agentsync/agentsync.toml"))).toBe(true);
    expect(existsSync(join(project, "native-applied"))).toBe(true);
    expect(f.calls().find((call) => call.args[0] === "apply")?.home).toBe(userHome);
  });

  test("populated canonical tree without TOML uses private init and preserves canonical files", () => {
    const f = fixture();
    const dest = join(f.project, ".agentsync");
    for (const file of ["hooks/custom.toml", "mcp/private.toml", "memory/AGENTS.md"])
      put(join(dest, file), "keep private\n");
    const result = f.run(["--project", "--agents", "claude", "--yes", "--no-apply"]);
    expect(result.status).toBe(0);
    for (const file of ["hooks/custom.toml", "mcp/private.toml", "memory/AGENTS.md"]) {
      expect(readFileSync(join(dest, file), "utf8")).toBe("keep private\n");
    }
    expect(f.calls().find((call) => call.args[0] === "init")?.args).not.toContain(f.project);
  });

  test("rerun preserves config, owned edits and unrelated skills, reuses enabled agents", () => {
    const f = fixture();
    expect(f.run(["--user", "--yes", "--agents", "claude", "--no-apply"]).status).toBe(0);
    const dest = join(f.home, ".agentsync");
    put(join(dest, "skills/testing/SKILL.md"), "local edits\n");
    put(join(dest, "skills/custom/SKILL.md"), "custom skill\n");
    put(join(dest, "memory/fragments/dotagent.md"), "local memory\n");
    const config = readFileSync(join(dest, "agentsync.toml"), "utf8");
    const result = f.run(["--user", "--yes", "--no-apply"]);
    expect(result.status).toBe(0);
    expect(result.output).toContain("0 installed, 2 preserved");
    expect(readFileSync(join(dest, "agentsync.toml"), "utf8")).toBe(config);
    expect(readFileSync(join(dest, "skills/testing/SKILL.md"), "utf8")).toBe("local edits\n");
    expect(readFileSync(join(dest, "skills/custom/SKILL.md"), "utf8")).toBe("custom skill\n");
    expect(readFileSync(join(dest, "memory/fragments/dotagent.md"), "utf8")).toBe("local memory\n");
    expect(f.calls().filter((call) => call.args[0] === "apply")).toHaveLength(0);
  });

  test("--force moves whole owned paths to unique backups without deleting user content", () => {
    const f = fixture();
    expect(f.run(["--project", "--yes", "--agents", "claude", "--no-apply"]).status).toBe(0);
    const dest = join(f.project, ".agentsync");
    put(join(dest, "skills/testing/SKILL.md"), "old skill\n");
    put(join(dest, "skills/testing/custom.txt"), "user bundle\n");
    put(join(dest, "skills/testing/private.local"), "private fixture\n");
    put(join(f.project, ".gitignore"), "/.agentsync/skills/testing/private.local\n");
    put(join(dest, "memory/fragments/dotagent.md"), "old fragment\n");
    for (let i = 0; i < 2; i++) {
      expect(f.run(["--project", "--yes", "--force", "--no-apply"]).status).toBe(0);
    }
    const backups = readdirSync(f.project).filter((name) =>
      name.startsWith(".agentsync.dotagent-backup."),
    );
    expect(backups).toHaveLength(2);
    for (const name of backups) {
      expect(readFileSync(join(f.project, name, ".gitignore"), "utf8")).toBe("*\n");
    }
    const first = backups
      .map((name) => join(f.project, name))
      .find((path) => existsSync(join(path, "skills/testing/custom.txt")))!;
    expect(readFileSync(join(first, "skills/testing/SKILL.md"), "utf8")).toBe("old skill\n");
    expect(readFileSync(join(first, "skills/testing/custom.txt"), "utf8")).toBe("user bundle\n");
    expect(readFileSync(join(first, "skills/testing/private.local"), "utf8")).toBe(
      "private fixture\n",
    );
    expect(readFileSync(join(first, "memory/fragments/dotagent.md"), "utf8")).toBe(
      "old fragment\n",
    );
    expect(existsSync(join(dest, "skills/testing/custom.txt"))).toBe(false);
  });

  test("explicit agents are additive and enable existing disabled registrations", () => {
    const f = fixture();
    put(
      join(f.home, ".agentsync/agentsync.toml"),
      "[agents]\nclaude = { enabled = false }\ncodex = { enabled = true }\n",
    );
    expect(f.run(["--user", "--yes", "--agents", "claude", "--no-apply"]).status).toBe(0);
    const config = readFileSync(join(f.home, ".agentsync/agentsync.toml"), "utf8");
    expect(config).toContain("claude = { enabled = true }");
    expect(config).toContain("codex = { enabled = true }");
  });

  test("fresh or empty --yes configurations never silently choose agents", () => {
    for (const existing of [false, true]) {
      const f = fixture();
      if (existing) put(join(f.home, ".agentsync/agentsync.toml"), "[agents]\n");
      const result = f.run(["--yes"]);
      expect(result.status).not.toBe(0);
      expect(result.output).toContain("--agents");
      expect(existsSync(join(f.home, ".agentsync/skills"))).toBe(false);
    }
  });

  test("unknown supported-agent name fails before canonical mutation", () => {
    const f = fixture();
    const result = f.run(["--user", "--yes", "--agents", "claude,not-an-agent"]);
    expect(result.status).not.toBe(0);
    expect(existsSync(join(f.home, ".agentsync"))).toBe(false);
  });

  test.each([
    ["--wat"],
    ["--agents"],
    ["--agents", ""],
    ["--agents", "claude,,codex"],
    ["--agents", "claude,../escape"],
    ["--agents", "-claude"],
    ["--method", "npm"],
    ["--user", "--project"],
    ["--user", "--path", "."],
    ["--apply", "--no-apply"],
    ["--ref", "../evil"],
    ["--source"],
  ])("rejects invalid arguments %j before side effects", (...args) => {
    const f = fixture();
    expect(f.run(args).status).not.toBe(0);
    expect(f.calls()).toHaveLength(0);
    expect(readdirSync(f.home)).toHaveLength(0);
  });

  test("--dry-run is zero-write and zero-dependency even with --force and a missing dependency", () => {
    const f = fixture(false);
    const before = readdirSync(f.home);
    const result = f.run([
      "--dry-run",
      "--force",
      "--path",
      join(f.root, "not-created"),
      "--agents",
      "claude",
    ]);
    expect(result.status).toBe(0);
    expect(result.output).toContain("No files written");
    expect(readdirSync(f.home)).toEqual(before);
    expect(existsSync(join(f.root, "not-created"))).toBe(false);
    expect(existsSync(f.env.DEPENDENCIES)).toBe(false);
    expect(f.calls()).toHaveLength(0);
  });

  test("help needs no HOME or dependencies", () => {
    const f = fixture(false);
    const result = f.run(["--help"], { HOME: "" });
    expect(result.status).toBe(0);
    expect(result.output).toContain("--method");
    expect(f.calls()).toHaveLength(0);
  });

  test("dependency download failure aborts cleanly without canonical content", () => {
    const f = fixture(false);
    const result = f.run(["--yes", "--agents", "claude", "--method", "binary"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Download failed");
    expect(existsSync(join(f.home, ".agentsync"))).toBe(false);
    expect(existsSync(join(f.home, ".agentsync.dotagent-lock"))).toBe(false);
    expect(readFileSync(f.env.DEPENDENCIES, "utf8")).toBe("curl\n");
  });

  test("pack download failure does not scaffold canonical config", () => {
    const f = fixture();
    // Invoke without --source, keeping the same hermetic PATH.
    const result = Bun.spawnSync(["/bin/sh", installer, "--yes", "--agents", "claude"], {
      cwd: f.project,
      env: f.env,
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
    });
    expect(result.exitCode).not.toBe(0);
    expect(result.stderr.toString()).toContain("Download failed");
    expect(existsSync(join(f.home, ".agentsync"))).toBe(false);
    expect(f.calls()).toHaveLength(0);
  });

  test("existing AgentSync is reused even when a different method is explicit", () => {
    const f = fixture();
    expect(f.run(["--yes", "--agents", "claude", "--method", "rpm", "--no-apply"]).status).toBe(0);
    expect(existsSync(f.env.DEPENDENCIES)).toBe(false);
  });

  test("failed check or preview stops apply and does not print secret-bearing diagnostics", () => {
    for (const command of ["check --scope", "apply --dry-run"]) {
      const f = fixture();
      const result = f.run(["--yes", "--agents", "claude"], { FAIL_COMMAND: command });
      expect(result.status).not.toBe(0);
      expect(result.output).not.toContain("SECRET_FROM_INVALID_CONFIG");
      expect(existsSync(join(f.home, "native-applied"))).toBe(false);
      expect(existsSync(join(f.home, ".agentsync.dotagent-lock"))).toBe(false);
    }
  });

  test("failed real apply is not reported as success", () => {
    const f = fixture();
    const result = f.run(["--yes", "--agents", "claude"], { FAIL_APPLY: "1" });
    expect(result.status).not.toBe(0);
    expect(result.output).not.toContain("DotAgent is ready.");
    expect(result.output).toContain("safe to rerun");
  });

  test("native destination symlink ancestors are rejected before apply", () => {
    const f = fixture();
    const outside = join(f.root, "external-native");
    mkdirSync(outside);
    symlinkSync(outside, join(f.project, ".claude"));
    const result = f.run(["--project", "--yes", "--agents", "claude"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("symlink");
    expect(existsSync(join(f.project, "native-applied"))).toBe(false);
    expect(readdirSync(outside)).toHaveLength(0);
  });

  test("failed replacement restores the backed-up owned path", () => {
    const f = fixture();
    expect(f.run(["--yes", "--agents", "claude", "--no-apply"]).status).toBe(0);
    const fragment = join(f.home, ".agentsync/memory/fragments/dotagent.md");
    put(fragment, "preserve this edited fragment\n");
    put(
      join(f.bin, "mv"),
      `#!/bin/sh
case "$1" in */.dotagent-staging.*/item) exit 1 ;; esac
exec /bin/mv "$@"
`,
    );
    chmodSync(join(f.bin, "mv"), 0o755);
    const result = f.run(["--yes", "--force", "--no-apply"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("previous content was restored");
    expect(readFileSync(fragment, "utf8")).toBe("preserve this edited fragment\n");
  });

  test("concurrent/stale lock fails closed without stealing ownership", () => {
    const f = fixture();
    const lock = join(f.home, ".agentsync.dotagent-lock");
    mkdirSync(lock);
    const result = f.run(["--yes", "--agents", "claude"]);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Another setup");
    expect(existsSync(lock)).toBe(true);
    expect(f.calls()).toHaveLength(0);
  });

  test.each([
    "source-root",
    "source-file",
    "source-skill",
    "dest-root",
    "dest-fragments",
    "dest-skill",
    "dest-config",
    "project-parent",
    "user-state",
  ])("refuses symlink traversal at %s, including --force", (kind) => {
    const f = fixture();
    const outside = join(f.root, "outside");
    mkdirSync(outside);
    put(join(outside, "keep"), "untouched\n");
    const dest = join(f.project, ".agentsync");
    let args = ["--project", "--yes", "--agents", "claude", "--force"];
    if (kind === "source-root") {
      symlinkSync(f.source, join(f.root, "linked-source"));
      args = [...args, "--source", join(f.root, "linked-source")];
    } else if (kind === "source-file") {
      symlinkSync(join(outside, "keep"), join(f.source, ".agentsync/skills/testing/linked"));
    } else if (kind === "source-skill") {
      symlinkSync(outside, join(f.source, ".agentsync/skills/linked"));
    } else if (kind === "dest-root") {
      symlinkSync(outside, dest);
    } else if (kind === "dest-fragments") {
      mkdirSync(join(dest, "memory"), { recursive: true });
      symlinkSync(outside, join(dest, "memory/fragments"));
    } else if (kind === "dest-skill") {
      mkdirSync(join(dest, "skills"), { recursive: true });
      symlinkSync(outside, join(dest, "skills/testing"));
    } else if (kind === "dest-config") {
      mkdirSync(dest);
      symlinkSync(join(outside, "keep"), join(dest, "agentsync.toml"));
    } else if (kind === "project-parent") {
      symlinkSync(outside, join(f.root, "linked-parent"));
      args = [...args, "--path", join(f.root, "linked-parent/new")];
    } else {
      mkdirSync(join(f.home, ".agentsync"));
      symlinkSync(outside, join(f.home, ".agentsync/.state"));
    }
    const result = f.run(args);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain("symlink");
    expect(readFileSync(join(outside, "keep"), "utf8")).toBe("untouched\n");
    expect(readdirSync(outside)).toEqual(["keep"]);
    expect(f.calls()).toHaveLength(0);
  });
});
