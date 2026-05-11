---
name: conventions
description: "Use once per project to install repo-level agent conventions, hooks, and deterministic checks through Agent Toolkit."
---

# Conventions

Use Agent Toolkit as the convention gate. Do not install separate lint-staged, ESLint, or Prettier enforcement.

## Setup

```bash
bunx @harryy/agent-toolkit repo bootstrap
bunx @harryy/agent-toolkit repo intel
bunx @harryy/agent-toolkit repo check
```

This creates:

```text
AGENTS.md
.agents/agents.json
.agents/README.md
scripts/agent-check
<hook-dir>/pre-commit
<hook-dir>/pre-push
<hook-dir>/commit-msg
<hook-dir>/post-checkout
```

Vite+ projects use `.vite-hooks` for `<hook-dir>`; other repos default to Husky `.husky`. When the repo is a git checkout, bootstrap configures the matching hook path:

```bash
git config core.hooksPath <hook-runtime-dir>
```

## What This Enforces

| Convention | Enforced By |
|---|---|
| `AGENTS.md` exists | `agent-toolkit repo check` |
| `.agents/agents.json` exists | `agent-toolkit repo check` |
| New JS-platform code is TypeScript | `agent-toolkit repo check` |
| No `.js` or `.jsx` source files | `agent-toolkit repo check` |
| No `tsc` check workflow | `agent-toolkit repo check` |
| Use `oxlint --type-aware --type-check` | `agent-toolkit repo check` |
| Use `oxfmt` | `agent-toolkit repo check` |
| Debug statements, placeholders, empty catches, likely secrets | `agent-toolkit repo check` |
| Conventional Commit messages | `<hook-dir>/commit-msg` |
| No hook bypassing | Global rules |

## Completion

Run:

```bash
bunx @harryy/agent-toolkit repo check
agents sync --check
```

Run `agents sync --check` only when `AGENTS.md` or `.agents/` changed.
