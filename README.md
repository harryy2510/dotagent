<p align="center">
  <h1 align="center">⚡ DotAgent</h1>
  <p align="center">
    <strong>Your agent setup: skills, agents, commands, tooling, and shared rules in one plugin.</strong>
  </p>
  <p align="center">
    <code>28 skills</code> · <code>20 agents</code> · <code>6 commands</code> · <code>zero bloat</code>
  </p>
</p>

<p align="center">
  <a href="https://react.dev"><img src="https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 19"></a>
  <a href="https://www.typescriptlang.org"><img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript"></a>
  <a href="https://tanstack.com/start"><img src="https://img.shields.io/badge/TanStack_Start-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="TanStack Start"></a>
  <a href="https://supabase.com"><img src="https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase"></a>
  <a href="https://workers.cloudflare.com"><img src="https://img.shields.io/badge/Cloudflare_Workers-F38020?style=flat-square&logo=cloudflare&logoColor=white" alt="Cloudflare Workers"></a>
  <a href="https://tailwindcss.com"><img src="https://img.shields.io/badge/Tailwind_v4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind v4"></a>
  <a href="https://ui.shadcn.com"><img src="https://img.shields.io/badge/shadcn/ui-000000?style=flat-square&logo=shadcnui&logoColor=white" alt="shadcn/ui"></a>
  <a href="https://tanstack.com/query"><img src="https://img.shields.io/badge/React_Query-FF4154?style=flat-square&logo=reactquery&logoColor=white" alt="React Query"></a>
  <a href="https://react-hook-form.com"><img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white" alt="React Hook Form"></a>
  <a href="https://zod.dev"><img src="https://img.shields.io/badge/Zod_v4-3E67B1?style=flat-square&logo=zod&logoColor=white" alt="Zod v4"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-000000?style=flat-square&logo=bun&logoColor=white" alt="Bun"></a>
  <a href="https://oxc.rs"><img src="https://img.shields.io/badge/Oxlint-111827?style=flat-square" alt="Oxlint"></a>
  <a href="https://oxc.rs"><img src="https://img.shields.io/badge/Oxfmt-111827?style=flat-square" alt="Oxfmt"></a>
  <a href="https://vite.dev"><img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite"></a>
  <a href="https://playwright.dev"><img src="https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white" alt="Playwright"></a>
</p>

---

> **Note:** DotAgent is distributed through the [agent-toolkit](https://github.com/harryy2510/agent-toolkit) marketplace.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   claude plugin marketplace add harryy2510/agent-toolkit                  │
│   claude plugin install dotagent@agent-toolkit                           │
│   /dotagent:setup                                                 │
│                                                                            │
│   That's it. Every project. Every agent. Same standards.                   │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Skills

Loaded on-demand. This list mirrors `plugins/dotagent/skills/*/SKILL.md`; only the relevant skill enters context, and the rest cost 0 tokens.

| | Skill | What it teaches |
|---|---|---|
| 🏗️ | `scaffold` | Full project scaffolding: TanStack Start + Supabase + Cloudflare |
| 🔧 | `toolchain` | Bun, TypeScript, oxlint, oxfmt, hooks, Conventional Commits |
| 🧭 | `repo-intelligence` | Agent Toolkit repo context and enforcement checks |
| 🤖 | `agent-routing` | Available role, skill, and native subagent routing |
| 🔧 | `project-setup` | DX tooling, dotenvx encrypted env, CI/CD |
| ✅ | `conventions` | One-time convention setup: enforces style via tooling forever |
| 📚 | `source-driven-development` | Official-docs-first framework and library implementation |
| 🧱 | `api-and-interface-design` | API contracts, module boundaries, errors, and compatibility |
| 🎨 | `ui` | Tailwind v4, shadcn/base-ui, CVA variants, dark mode, animations |
| 🧩 | `shadcn` | Adding, searching, fixing, composing shadcn/ui components |
| 📝 | `forms-rhf-zod` | react-hook-form + zod v4, create/edit modes, useWatch patterns |
| 🔄 | `react-query-mutative` | QueryClient config, key factories, optimistic updates |
| 📦 | `zustand-x-ui-state` | zustand-x v6 stores, boundary rules, theme system |
| 🛣️ | `tanstack-start-cloudflare` | Routes, layouts, server functions, deploy config |
| 🔐 | `supabase-auth-data` | 3 Supabase clients, auth flow, migrations, RLS |
| ☁️ | `cloudflare` | Workers best practices, Wrangler CLI, wrangler.jsonc |
| ⚡ | `vite` | Vite config, plugin API, SSR, Rolldown migration |
| 🚀 | `react-best-practices` | 57 performance rules + composition patterns |
| 🗄️ | `supabase-postgres-best-practices` | Indexing, query plans, RLS perf, connection pooling |
| 🧹 | `deslop` | Slop scanner for debug leftovers, placeholders, and risky code |
| ✂️ | `code-simplification` | Behavior-preserving simplification and cleanup |
| 🔒 | `security-and-hardening` | Auth, input, secrets, permissions, and boundary review |
| 📈 | `performance-optimization` | Measure-first speed, latency, query, bundle, and runtime work |
| 🧭 | `deprecation-and-migration` | Legacy cleanup, migrations, compatibility, and removal plans |
| 📄 | `documentation-and-adrs` | Durable technical docs, decisions, runbooks, and API notes |
| 📊 | `status-report` | Client-ready progress reports from git, prior reports, docs, and code |
| 🧪 | `testing` | Vitest + Testing Library + Playwright, file conventions, what to test |
| 🐞 | `debugging` | Root-cause workflow for bugs, regressions, flakes, incidents, and fix verification |

---

## 🤖 Agents

**20 specialists. Kebab-case native names, proactive triggers, least-privilege tools, and skill hints when the host exposes DotAgent role profiles.**

```
╔══════════════════════════════════════════════════════════════════════╗
║                                                                      ║
║  💻 ENGINEERING          🧪 TESTING         📋 PRODUCT              ║
║  ─────────────           ─────────          ──────────               ║
║  Backend Architect       API Tester         Product Manager          ║
║  Frontend Developer      Perf Benchmarker   UX Architect             ║
║  Senior Developer        E2E Test Writer                             ║
║  Database Optimizer      E2E Test Runner    🎛️ ORCHESTRATION         ║
║  DevOps Automator                           ────────────────         ║
║  Security Engineer                          Agents Orchestrator      ║
║  Debugger                                   (speed-biased routing)   ║
║  Rapid Prototyper                                                    ║
║  Software Architect                                                  ║
║  Code Reviewer                                                       ║
║  Git Workflow Master                                                 ║
║  Technical Writer                                                    ║
║  MCP Builder                                                         ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## ⚡ Commands

Type these directly in Claude Code. This list mirrors `plugins/dotagent/commands/*.md`.

| Command | What happens |
|---|---|
| `/deslop` | 🧹 Scans codebase for slop |
| `/dotagent:setup` | 🔧 One-time: installs managed global rules for Claude and Codex |
| `/skill-lint` | ✅ Validates skills + agents → checks frontmatter, size, refs, triggers |
| `/status-report` | 📊 Generates a client-ready progress report from the last report forward |
| `/dotagent:uninstall` | 🗑️ Removes DotAgent conventions from Claude and Codex global instruction files |
| `/dotagent:update` | 🔄 Updates plugin + refreshes Claude and Codex conventions |

```
  bunx @harryy/agent-toolkit repo intel   ← builds local repo context
       │
       ▼
  .agents/intel/summary.md                ← agents read this first
       │
       ▼
  bunx @harryy/agent-toolkit repo check   ← rules, tooling, slop checks
       │
       ▼
  Report + fix offers                     ← agent interprets, you decide
```

---

## 🛡️ Three-Layer Convention Defense

Run Agent Toolkit once per project. Done forever.

```
  ┌─────────────────────────────────────────────┐
  │  Layer 1: CLAUDE.md / AGENTS.md             │
  │  AI reads the rules → generates correct     │
  │  code on first try                          │
  ├─────────────────────────────────────────────┤
  │  Layer 2: oxlint + oxfmt                    │
  │  Fast lint, type-check, and formatting      │
  │  Type-aware checks without tsc              │
  ├─────────────────────────────────────────────┤
  │  Layer 3: Pre-commit hooks                  │
  │  Hard gate: wrong code NEVER gets          │
  │  committed                                  │
  └─────────────────────────────────────────────┘
```

```bash
bunx @harryy/agent-toolkit repo bootstrap
bunx @harryy/agent-toolkit repo intel
bunx @harryy/agent-toolkit repo check
```

---

## 🎯 Agent Orchestration

The `agent-routing` skill maps work types to specialists when the current host exposes DotAgent skills or the role profile files are accessible. It is skipped for normal speed-mode edits unless the user asks for role routing or the task is broad enough for subagents. When the host supports native subagents and policy allows it, a matching specialist can be invoked for self-contained work; otherwise the role profile is lightweight local guidance. Multi-agent orchestration stays in the main thread so specialists can actually be called directly.

The `agents-orchestrator` is for broad, multi-role work. It keeps coordination in the main thread, creates a short execution plan, starts the first concrete step immediately, and uses native subagents only for independent slices when the current host exposes them.

```
  ┌──────────────┐
  │ 1. Context   │ ──→  Read only enough to scope the work
  ├──────────────┤
  │ 2. Plan      │ ──→  Short execution plan for broad/risky work
  ├──────────────┤
  │ 3. Execute   │ ──→  Start directly; split independent slices if useful
  ├──────────────┤
  │ 4. Check     │ ──→  Focused checks; full checks for PR/commit/release
  ├──────────────┤
  │ 5. Ship      │ ──→  Commit/PR only if you say so
  └──────────────┘
```

---

## 📁 Project Structure

```
dotagent/
├── CLAUDE.md                ← Claude-specific plugin compatibility rules
├── AGENTS.md                ← Shared agent conventions for global symlinks
├── .claude-plugin/          ← Claude Code plugin manifest
├── .codex-plugin/           ← Codex plugin manifest
├── gemini-extension/        ← Gemini CLI extension wrapper
│   ├── gemini-extension.json
│   ├── AGENTS.md            ← symlink to ../AGENTS.md
│   └── skills               ← symlink to ../skills
├── agents/                  ← 20 specialist role profiles + Codex metadata
│   ├── openai.yaml          ← Codex plugin interface metadata, not a role
│   ├── agents-orchestrator.md
│   ├── engineering-*.md
│   ├── testing-*.md
│   ├── product-manager.md
│   └── design-ux-architect.md
├── skills/                  ← 28 on-demand skills
│   ├── agent-routing/
│   ├── api-and-interface-design/
│   ├── cloudflare/
│   ├── code-simplification/
│   ├── conventions/
│   ├── debugging/
│   ├── deprecation-and-migration/
│   ├── deslop/
│   ├── documentation-and-adrs/
│   ├── forms-rhf-zod/
│   ├── performance-optimization/
│   ├── project-setup/
│   ├── react-best-practices/
│   ├── react-query-mutative/
│   ├── repo-intelligence/
│   ├── scaffold/
│   ├── security-and-hardening/
│   ├── shadcn/
│   ├── source-driven-development/
│   ├── status-report/
│   ├── supabase-auth-data/
│   ├── supabase-postgres-best-practices/
│   ├── tanstack-start-cloudflare/
│   ├── testing/
│   ├── toolchain/
│   ├── ui/
│   ├── vite/
│   └── zustand-x-ui-state/
├── commands/                ← Slash commands
│   ├── deslop.md
│   ├── setup.md
│   ├── skill-lint.md
│   ├── status-report.md
│   ├── uninstall.md
│   └── update.md
└── scripts/                 ← Pure bash tooling (0 tokens)
    ├── deslop.sh
    ├── setup.sh
    ├── teardown.sh
    └── skill-lint.sh
```

---

## 🔧 Install / Update / Uninstall

Claude Code uses its native plugin system. Codex and other agents can consume the shared instructions through `AGENTS.md`, `.agents/agents.json`, and the Codex plugin manifest. `.agents/agents.json`, `.agents/intel/`, and `scripts/agent-check` are sync, generated-intelligence, and enforcement surfaces; DotAgent role profiles are the Markdown files under `plugins/dotagent/agents/`.

Agent Toolkit is tooling only. It pulls or updates DotAgent, writes DotAgent-managed rules into global agent files, links the Gemini extension, builds repo intelligence, and runs checks. DotAgent owns the rules, skills, role profiles, manifests, commands, and host-specific behavior.

### Install

Claude Code:

```bash
# 1. Add the marketplace
claude plugin marketplace add harryy2510/agent-toolkit

# 2. Install the plugin
claude plugin install dotagent@agent-toolkit

# 3. Run setup in Claude Code
/dotagent:setup
```

Gemini CLI:

```bash
gemini extensions link plugins/dotagent/gemini-extension
```

Codex:

```bash
bunx @harryy/agent-toolkit setup --yes
bunx @harryy/agent-toolkit repo migrate
```

Codex consumes repo and global `AGENTS.md` rules directly. Agent Toolkit setup/update registers this DotAgent checkout as a Codex local marketplace by writing `[marketplaces.dotagent]` to `~/.codex/config.toml`; it should not copy DotAgent skills into `~/.codex/skills`. The local Codex plugin manifest at `plugins/dotagent/.codex-plugin/plugin.json` declares DotAgent skills with `"skills": "./skills/"`, and Codex UI metadata lives in `agents/openai.yaml` files. Codex discovery should come through the local marketplace entry and DotAgent plugin metadata, not through copied files. Agent Toolkit setup/update does not convert `plugins/dotagent/agents/*.md` into native Codex subagents; until Codex lists those skills/agents in the active session, treat DotAgent role names as guidance only.

For repo-local agent sync:

```bash
agents sync --path .
agents watch --path .
```

### Update

```bash
claude plugin marketplace update agent-toolkit
claude plugin update dotagent@agent-toolkit
```

The marketplace update fetches the latest agent-toolkit index. The plugin update pulls the new version. Both steps needed.

Or from Claude Code: `/dotagent:update`

### Uninstall

Run `/dotagent:uninstall` first (removes managed conventions from Claude and Codex global instruction files), then:

```bash
claude plugin uninstall dotagent@agent-toolkit
```

### What happens where

```
  marketplace add           →  Registers harryy2510/agent-toolkit as a plugin source
  Claude plugin install      →  Installs dotagent from the marketplace
                                 Claude skills, agents, commands available immediately

  agent-toolkit setup/update → Pulls DotAgent, writes DotAgent rules into
                                ~/.claude/CLAUDE.md and ~/.codex/AGENTS.md,
                                and links the Gemini extension

  /dotagent:update           →  Claude plugin update + refreshes global rules

  /dotagent:uninstall        →  Removes managed conventions from global instruction files
  plugin uninstall           →  Removes plugin from cache
```

---

## ✅ Validate

```
/skill-lint              Lint everything
/skill-lint skills       Lint skills only
/skill-lint agents       Lint agents only
bunx @harryy/agent-toolkit repo check
```

---

## 👥 For the Team

### Adding a skill

1. Create `skills/<name>/SKILL.md`:
   ```yaml
   ---
   name: my-skill
   description: "Use when [trigger condition]."
   ---
   ```
2. Heavy content → `skills/<name>/references/`
3. Add it to the README skill inventory, routing/docs when needed, and `agents/openai.yaml` if Codex UI metadata is useful
4. Run `/skill-lint skills`

### Adding an agent

1. Create `agents/<name>.md`:
   ```yaml
   ---
   name: my-agent
   description: "MUST BE USED when [trigger]. Use PROACTIVELY for [work type]."
   model: inherit
   tools: Read, Grep, Glob, Bash
   skills:
     - toolchain
     - repo-intelligence
   color: blue
   ---
   ```
2. Keep it concise, but do not delete essential operating knowledge just to satisfy a line target. Include role, triggers, useful skills, tools, rules, and outputs.
3. Run `/skill-lint agents`

### Contributing rules

The plugin follows its own conventions:

```
  ✅  Single quotes, no semicolons, trailing commas
  ✅  type not interface, inline type imports
  ✅  Named imports from react (never React.xxx)
  ✅  bunx not npx, bun not npm
```

---

## Sources And Credits

DotAgent is repo-native, but it deliberately borrows good ideas from proven agent and platform sources:

- [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills) - selected process-oriented skills adapted under MIT.
- [Superpowers](https://github.com/obra/superpowers) - workflow discipline reference; DotAgent keeps the useful parts but defaults to speed mode and does not vendor Superpowers planning docs.
- [AgentSys](https://github.com/agent-sh/agentsys) - source for the `deslop` pattern set and earlier repo-intelligence experiments; current repo intelligence is handled by Agent Toolkit.
- [OWASP GenAI Security Project](https://genai.owasp.org/llm-top-10/) and [Cloudflare's OWASP LLM risk primer](https://www.cloudflare.com/en-gb/learning/ai/owasp-top-10-risks-for-llms/) - source prompts for the LLM and agentic security checklist.
- [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md) - UI review guidance fetched fresh when the `ui` skill reviews interfaces.
- Official docs are the source of truth for stack-specific skills: [React](https://react.dev), [TanStack Start](https://tanstack.com/start), [TanStack Query](https://tanstack.com/query), [Supabase](https://supabase.com/docs), [Cloudflare Workers](https://developers.cloudflare.com/workers/), [shadcn/ui](https://ui.shadcn.com), [React Hook Form](https://react-hook-form.com), [Zod](https://zod.dev), [Bun](https://bun.sh), [Oxc](https://oxc.rs), [Vite](https://vite.dev), [Playwright](https://playwright.dev), [GitHub Actions](https://docs.github.com/en/actions), and [PostgreSQL](https://www.postgresql.org/docs/current/).
