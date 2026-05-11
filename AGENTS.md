# DotAgent Repository Instructions

## Purpose

This repository contains the DotAgent plugin and the shared agent rules it installs. Keep plugin behavior agent-agnostic where possible while preserving Claude Code plugin compatibility.

## Agent Sync

- `AGENTS.md` is the canonical repository instruction file.
- `.agents/agents.json` is the source of truth for `agents` CLI integration settings.
- Run `agents sync --path .` after changing `.agents/agents.json` when you want local tool config.
- Do not commit generated outputs such as root `CLAUDE.md`, `.codex/`, `.claude/`, `.cursor/`, `.gemini/`, `.windsurf/`, `.opencode/`, or `.agents/generated/`.
- Do not commit `.agents/intel/`; it is local generated repo intelligence.
- Do not add Superpowers docs or planning docs to this public repo.

## Repo Intelligence

- Before broad exploration, read `.agents/intel/summary.md` if it exists.
- `.agents/intel/` is generated local repo intelligence, not a role-profile directory.

## Plugin Layout

- `plugins/dotagent/.claude-plugin/plugin.json` is the Claude Code manifest.
- `plugins/dotagent/.codex-plugin/plugin.json` is the Codex plugin manifest.
- `plugins/dotagent/gemini-extension/` is the Gemini CLI extension wrapper. It links to the shared `AGENTS.md` and `skills/` without exposing Claude-only agent definitions to Gemini.
- `plugins/dotagent/agents/*.md` are role profiles; `plugins/dotagent/agents/openai.yaml` is Codex interface metadata, not a role profile.
- `plugins/dotagent/CLAUDE.md` is the Claude Code compatibility rules file for the plugin package.
- `plugins/dotagent/AGENTS.md` is the shared global rules source for agent-agnostic setup.
- `plugins/dotagent/skills/` should stay usable as focused skill instructions across compatible agents.
- `plugins/dotagent/scripts/setup.sh` and `teardown.sh` must preserve user content outside managed fences.

## Development Rules

- Create git worktrees inside the same repository under `.worktrees/`.
- Keep `.worktrees/` gitignored.
- When creating a worktree, copy every source-checkout env file whose basename starts with `.env` into the same relative path in the new worktree before install, setup, or checks.
- Prefer `bun` and `bunx` in Bun projects.
- Use TypeScript for JavaScript-platform source files. Do not add `.js` or `.jsx` source files.
- Use `oxlint --type-aware --type-check`, not `tsc`.
- Use `oxlint`, not ESLint.
- Use `oxfmt`, not Prettier.
- Use the repo's active committed hook manager for git hooks: Vite+ projects use `.vite-hooks`, other repos default to Husky `.husky`. Do not introduce `.githooks` or ad hoc hook folders.
- GitHub Actions workflows must use Node.js 24 with `actions/setup-node@v6` when a Node runtime is needed.
- Any commits must use Conventional Commit format.
- Keep scripts POSIX-friendly bash where possible.
- Do not read, dump, echo, print, log, or expose actual environment variable values from the process environment, secret stores, or `.env*` files. This rule has no exception.
- Do not edit files whose names start with `.env` unless the user explicitly asks you to add or append specific env vars; when asked, use only user-provided values or clearly fake placeholders, and still do not read existing values or print the file. The only standing exception is mechanical copy-only env file copying during worktree creation; never read, print, diff, stage, or commit those copied contents.
- Do not run destructive cleanup commands or `git push` unless the user explicitly asks in the current message.
- Run `plugins/dotagent/scripts/skill-lint.sh` when agent, skill, command, or plugin instruction files change.
- Validate JSON manifests after editing them.

<!-- AGENT-TOOLKIT:REPO-INTEL:START -->
## Agent Toolkit Repo Intelligence

- Before broad exploration, read `.agents/intel/summary.md` if it exists.
- Use the task-specific intel files it links to (`overview.md`, `tasks.md`, `graph.md`, `database.md`, and similar) to find the relevant source files before editing.
- `.agents/intel/` is generated and local; do not commit it.
<!-- AGENT-TOOLKIT:REPO-INTEL:END -->
