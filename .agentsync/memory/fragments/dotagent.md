# DotAgent

Local project `AGENTS.md` / `README` win. Machine-wide policy (deploy/AWS/env) is stricter and still applies.

These two layers are always on. **How-to is not.** When a row in Load matches, read that skill’s `SKILL.md` **before writing code**. Do not improvise that stack.

## Hard

- Never read, print, edit, or delete files named `.env*`. Naming env vars in source is fine.
- Git: no commands unless asked. Push only if this message asks. One push. Warn before `main`/`master`. No hook bypass. Conventional Commits.
- TypeScript only for JS-platform code. No new `.js`/`.jsx`. No Python unless the repo already is Python.
- Filenames: lowercase kebab-case. Named exports/imports. Default export only when the framework requires it. React: `import { useState } from 'react'` — never default-import React.
- Do not hand-edit generated files (DB types, Worker types, route trees). Regenerated DB types are the source of truth — no handwritten table/view/RPC types.
- Bun + `oxlint --type-aware --type-check` + `oxfmt` for TS repos. Do not add npm/ESLint/Prettier/`tsc --noEmit`.
- Do not add or change `package.json` scripts unless asked.
- Do not hide server-in-client with dynamic import. Fix the import graph.
- Surgical diffs. Smallest check that covers the change. Skip checks only for docs/trivial, and say so.

## Load

Read `~/.agentsync/skills/<name>/SKILL.md` (or this repo’s `.agentsync/skills/<name>/SKILL.md` before apply) when the task matches. Then follow it.

| When | Skill |
| --- | --- |
| Form, validation, `useForm`, zod | `forms-rhf-zod` |
| Supabase client, auth, RLS, migrations, DB types | `supabase-auth-data` |
| Postgres schema, query, RLS performance | `supabase-postgres-best-practices` |
| TanStack Start routes, server functions | `tanstack-start-cloudflare` |
| React Query keys/mutations | `react-query-mutative` |
| Client UI state (modals, tabs, filters) | `zustand-x-ui-state` |
| Tailwind / shadcn UI | `ui`, then `shadcn` |
| Tests | `testing` |
| Bug, regression, incident | `debugging` |
| Auth, secrets, uploads, webhooks | `security-and-hardening` |
| Public API / module boundary | `api-and-interface-design` |
| Package manager, lint, format, hooks, CI | `toolchain` |
| Framework API, upgrade, official docs | `source-driven-development` |
| Cloudflare Worker / wrangler.jsonc | `cloudflare` |
| Vite config / plugins | `vite` |

If the skill file is missing on this host, say so and stop guessing that stack.
