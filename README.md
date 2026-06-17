<p align="center">
  <a href="https://dotagent.dev"><img src="site/mark.png" width="88" height="88" alt="DotAgent" /></a>
</p>

<h1 align="center">DotAgent</h1>

<p align="center">
  Engineering skills and shared instructions for coding agents.<br />
  Mostly TypeScript, React, Supabase, and Cloudflare.
</p>

<p align="center">
  <a href="https://dotagent.dev">Website</a> ·
  <a href="#quick-start">Get started</a> ·
  <a href="#the-skills">Browse the skills</a> ·
  <a href="#credits">Credits</a>
</p>

<p align="center">
  <code>16 skills</code> · <code>1 memory fragment</code> · <code>AgentSync</code>
</p>

---

DotAgent keeps common rules in a memory fragment and detailed instructions in
separate skills. The fragment tells the agent which skill to read for the task.
[AgentSync](https://github.com/spxrogers/agentsync) is the required dependency that
syncs these files to your selected agents.

## Quick start

```sh
curl -fsSL https://dotagent.dev/install | sh
```

Choose where to install and which agents to configure. The installer sets up
AgentSync if needed, installs the pack, and shows the native file changes before
applying them.

| Your machine                          | One project                                      |
| :------------------------------------ | :----------------------------------------------- |
| Shared standards across your projects | A setup you can share with collaborators         |
| Installs into `~/.agentsync`          | Installs into the current project’s `.agentsync` |
| `sh install.sh --user`                | `sh install.sh --project`                        |

Prefer to inspect the script before running it?

```sh
curl -fsSL https://dotagent.dev/install -o install.sh
less install.sh
sh install.sh
```

For unattended setup, name your agents explicitly:

```sh
curl -fsSL https://dotagent.dev/install | sh -s -- \
  --project --agents claude,codex --yes
```

The installer targets **macOS and Linux**. It supports Homebrew, a verified prebuilt binary, Go, and Linux deb/rpm packages. It does not install the coding agents themselves or sign you into them. Agent coverage differs by host; consult [AgentSync’s capability matrix](https://github.com/spxrogers/agentsync/blob/main/docs/capability-matrix.md).

> This branch is the AgentSync-based edition. The older Claude marketplace plugin has a different layout and install flow. Don’t mix the old marketplace setup with these instructions.

## How it works

```text
                         DOTAGENT
                 One source of working knowledge
                              │
             ┌────────────────┴────────────────┐
             │                                 │
      MEMORY FRAGMENT                     SKILL LIBRARY
      Rules + load table                  Detailed how-to
      Present in context                  Read when relevant
             │                                 │
             └────────────────┬────────────────┘
                              │
                          AGENTSYNC
                  Renders native configuration
                              │
           Claude · Codex · Cursor · Gemini · OpenCode
                   Factory · other supported agents
```

### Memory fragment

The [memory fragment](.agentsync/memory/fragments/dotagent.md) sets the baseline: respect project guidance, protect environment files, avoid unauthorized Git operations, use the agreed toolchain, and verify changes at the right layer.

### Skill routing

The fragment maps tasks to skills. For example, form work loads React Hook Form
and Zod guidance. The agent reads those files when relevant instead of loading
the whole library into every conversation.

These are **agent instructions, not a sandbox or enforcement engine**. Whether an agent discovers and follows a skill depends on the host. DotAgent does not silently add linters, hooks, or application dependencies to your projects.

## The skills

Every skill is readable Markdown. Follow a name to inspect exactly what your agent gets.

### Foundation

| Skill                                                                               | What it brings                                           |
| :---------------------------------------------------------------------------------- | :------------------------------------------------------- |
| [`toolchain`](.agentsync/skills/toolchain/SKILL.md)                                 | Bun, TypeScript, Oxc, hooks, and consistent tooling      |
| [`source-driven-development`](.agentsync/skills/source-driven-development/SKILL.md) | Current primary sources before remembered framework APIs |
| [`api-and-interface-design`](.agentsync/skills/api-and-interface-design/SKILL.md)   | Explicit contracts, module boundaries, and useful errors |

### Interface

| Skill                                                                     | What it brings                                                    |
| :------------------------------------------------------------------------ | :---------------------------------------------------------------- |
| [`ui`](.agentsync/skills/ui/SKILL.md)                                     | Tailwind v4, design tokens, responsive layouts, and accessibility |
| [`shadcn`](.agentsync/skills/shadcn/SKILL.md)                             | Finding, adding, and composing shadcn/ui components               |
| [`forms-rhf-zod`](.agentsync/skills/forms-rhf-zod/SKILL.md)               | React Hook Form, Zod, validation, and editing flows               |
| [`react-query-mutative`](.agentsync/skills/react-query-mutative/SKILL.md) | Query keys, mutations, and optimistic updates                     |
| [`zustand-x-ui-state`](.agentsync/skills/zustand-x-ui-state/SKILL.md)     | Client-side state without confusing it with server data           |

### Platform & data

| Skill                                                                                             | What it brings                                                |
| :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------ |
| [`tanstack-start-cloudflare`](.agentsync/skills/tanstack-start-cloudflare/SKILL.md)               | Routes, server functions, and Cloudflare deployment patterns  |
| [`supabase-auth-data`](.agentsync/skills/supabase-auth-data/SKILL.md)                             | Clients, authentication, migrations, RLS, and generated types |
| [`supabase-postgres-best-practices`](.agentsync/skills/supabase-postgres-best-practices/SKILL.md) | Indexes, query plans, pooling, and RLS performance            |
| [`cloudflare`](.agentsync/skills/cloudflare/SKILL.md)                                             | Workers, Wrangler, and platform-aware implementation          |
| [`vite`](.agentsync/skills/vite/SKILL.md)                                                         | Build configuration, plugins, and runtime boundaries          |

### Quality

| Skill                                                                         | What it brings                                                |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------ |
| [`testing`](.agentsync/skills/testing/SKILL.md)                               | Vitest, Testing Library, and Playwright at the right layer    |
| [`debugging`](.agentsync/skills/debugging/SKILL.md)                           | Reproduce, trace the cause, and verify the repair             |
| [`security-and-hardening`](.agentsync/skills/security-and-hardening/SKILL.md) | Auth, secrets, inputs, webhooks, and agentic trust boundaries |

## Installer options

```sh
# Guided project setup
sh install.sh --project

# Configure a particular repository
sh install.sh --path /path/to/project --agents claude,codex

# Install from a local checkout without downloading the pack
sh install.sh --source /path/to/dotagent --project

# Review the plan without installing
sh install.sh --project --agents claude,codex --dry-run

# Stage the pack, but don't render native agent configuration yet
sh install.sh --user --agents claude,codex --no-apply

# Refresh existing DotAgent files, preserving a backup before replacement
sh install.sh --user --agents claude,codex --force
```

| Option                 | Purpose                                                           |
| :--------------------- | :---------------------------------------------------------------- |
| `--user` / `--project` | Choose machine-wide or current-project scope                      |
| `--path DIR`           | Choose another project directory; creates it if missing           |
| `--agents LIST`        | Add or enable comma-separated agent names without removing others |
| `--method METHOD`      | `auto`, `brew`, `binary`, `go`, `deb`, or `rpm`                   |
| `--ref REF`            | Fetch a specific DotAgent branch, tag, or commit                  |
| `--source DIR`         | Use a local DotAgent checkout                                     |
| `--yes`                | Run without prompts; select agents explicitly for a fresh setup   |
| `--force`              | Back up and replace same-named pack files                         |
| `--no-apply`           | Prepare the source without rendering native destinations          |
| `--apply`              | Preview and apply without a further confirmation                  |
| `--dry-run`            | Show the installation plan without making changes                 |
| `--help`               | Show the complete command reference                               |

### Bring your own AgentSync

An existing `agentsync` executable is reused. You can also install it separately:

```sh
# Homebrew
brew tap spxrogers/tap
brew install agentsync

# Go
go install github.com/spxrogers/agentsync/cmd/agentsync@latest
```

For prebuilt binaries and deb/rpm packages, see the [upstream installation guide](https://github.com/spxrogers/agentsync#install). [Gum](https://github.com/charmbracelet/gum) provides richer interactive prompts when it is already installed; plain terminal prompts work without it.

Automatic dependency setup prefers Homebrew on macOS when available, otherwise
a checksum-verified binary in `~/.local/bin`. It does not install Homebrew or Go.
System-wide deb/rpm installation requires an explicit method choice and consent;
`--yes --method deb` or `--yes --method rpm` supplies that consent.

### What stays yours

- Existing same-named skills and the DotAgent fragment are preserved by default.
- `--force` backs them up before replacement. It is not permission to delete unrelated configuration.
- Replacement backups live in sibling `.agentsync.dotagent-backup.*` directories with their own ignore rule. User-level AgentSync `.state/` is also Git-ignored; existing ignore rules are preserved.
- The installer leaves canonical `mcp/`, `hooks/`, and `memory/AGENTS.md` content alone.
- Agent registration goes through AgentSync’s commands, not hand-written TOML edits.
- Applying is a separate boundary: AgentSync may update native configuration for your configured agents, including existing non-DotAgent components. Read the preview before approving it.

After setup, AgentSync remains the tool for inspecting and applying the configuration:

```sh
agentsync check --scope user
agentsync apply --scope user --dry-run
agentsync apply --scope user
agentsync status --scope user
```

Use `--scope project` from the project directory for project installs. To remove or restore rendered files, follow [AgentSync’s documentation](https://github.com/spxrogers/agentsync); deleting the pack source alone does not undo a previous apply.

## Inside the repository

```text
.agentsync/
├── memory/fragments/dotagent.md   # Shared rules and skill routing
└── skills/<name>/                # SKILL.md and bundled references
install.sh                        # Guided, portable setup
site/                             # HTML + TypeScript, built with Vite
tests/                            # Isolated installer and site checks
.github/workflows/pages.yml       # Shared Utilities Studio deployment
```

### Work on the site

```sh
cd site
bun install
bun run dev

bun run check
bun run build
bun run preview
```

The build produces `site/dist`, including the root installer at `/install`,
the README at `/readme.md`, and the public skill files under `/pack/`.
`site/site-content.ts` serves those same files in development, so source links
do not depend on the current branch being published to GitHub. The page uses
native HTML controls and a small TypeScript interaction layer.

The install box always shows the standard `https://dotagent.dev/install` command.
The skill list is written directly in the HTML and is visible without JavaScript.

### Deploy to Pages

The GitHub Actions workflow reuses **[Utilities Studio’s Cloudflare Pages workflow](https://github.com/Utilities-Studio/infra/blob/main/.github/workflows/cloudflare-pages-deploy.yml)**. This is Cloudflare Pages, triggered by GitHub Actions, not GitHub Pages.

Configure the repository before its first deployment:

1. Set the Actions variable `CLOUDFLARE_ACCOUNT_ID`.
2. Set the Actions secret `CLOUDFLARE_API_TOKEN` with access to the intended Pages account.
3. Ensure this repository can call the shared `Utilities-Studio/infra` workflow and its actions.
4. Add `dotagent.dev` as a custom domain for the `dotagent` Pages project and complete its DNS setup. `CNAME` alone does not configure a Cloudflare domain.

Changes to the site, installer, README, or published skill files on `main` trigger
a rebuild. You can also run **Deploy site** manually. The workflow builds from
`site/` and deploys `dist/`. It does not grant deployment credentials to pull requests.

### Add a skill

Create `.agentsync/skills/<name>/SKILL.md` with a `name` and a task-specific `description` in frontmatter. Keep supporting references next to the skill. Update the fragment’s load table, the inventory above, and the skill list in `site/index.html` together.

## Credits

DotAgent is maintained by [Hariom Sharma](https://github.com/harryy2510). It builds on work worth naming:

- **[AgentSync](https://github.com/spxrogers/agentsync)** by [@spxrogers](https://github.com/spxrogers) and contributors, MIT licensed. The required runtime dependency for canonical configuration, native adapters, previews, and synchronization. DotAgent does not implement or claim ownership of that engine.
- **[Gum](https://github.com/charmbracelet/gum)** by Charm, MIT licensed. The optional terminal UI framework used by the installer.
- **[addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)**, MIT licensed. Inspiration and adapted guidance for source-driven development, interface design, and security skills.
- **[Supabase agent skills](https://github.com/supabase/agent-skills)**. The Postgres best-practices skill retains its bundled attribution and license metadata.
- **[Vercel Web Interface Guidelines](https://github.com/vercel-labs/web-interface-guidelines)**. The review reference used by the UI skill.
- **[OWASP GenAI Security Project](https://genai.owasp.org/llm-top-10/)**. Guidance for LLM and agentic risk checks.
- **[Utilities Studio infrastructure](https://github.com/Utilities-Studio/infra)**. The reusable Pages deployment workflow.

Official documentation remains the source of truth for stack guidance: [React](https://react.dev), [TanStack](https://tanstack.com), [Supabase](https://supabase.com/docs), [PostgreSQL](https://www.postgresql.org/docs/), [Cloudflare](https://developers.cloudflare.com/workers/), [shadcn/ui](https://ui.shadcn.com), [Tailwind CSS](https://tailwindcss.com), [React Hook Form](https://react-hook-form.com), [Zod](https://zod.dev), [Bun](https://bun.sh), [Oxc](https://oxc.rs), [Vite](https://vite.dev), and [Playwright](https://playwright.dev).
