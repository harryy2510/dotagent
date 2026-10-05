# DotAgent

Local project `AGENTS.md` / `CLAUDE.md` / `README` win where they are stricter. Machine-wide
policy (deploys, cloud CLIs, environment files) is stricter still and always applies.

These rules are always on. **How-to is not:** when a row in Load matches, read that skill's
`SKILL.md` **before writing code**, then follow it. Do not improvise a stack a skill covers.

## Always on

- **`lean`**: one source reused everywhere; parse once at the edge and trust the types; libraries
  before hand-written code; copy the nearest existing pattern; delete what changes nothing.
- **`compliance`**: classify the data a change touches, enforce authorization and tenant
  isolation, keep secrets and personal data out of logs, register vendors, claim only what is
  true.

Read both skills once per session before the first change.

## Hard

- Never read, print, edit, create or delete files named `.env*` or `.dev.vars`. Naming variables
  in source is fine.
- Never run deploy, database, migration or cloud commands (`wrangler`, Supabase CLI, `psql`,
  `drizzle-kit migrate/push`, AWS/GCP/Azure CLIs). Write the files, print the command, wait.
- Git: no commands unless asked. Push only when this message asks; one push; warn before
  `main`/`master`. Never bypass hooks. Conventional Commits.
- TypeScript only for JavaScript-platform code; `strict` on. No new `.js`/`.jsx`. No Python unless
  the repo already is.
- Filenames lowercase kebab-case. Named exports and imports; default export only where a framework
  requires it. Never default-import React.
- Generated files (database types, Worker types, route trees) are never hand-edited; types derive
  from them or from schemas, never hand-written.
- **Toolchain: Bun + Vite+.** `vp fmt`, `vp lint` (type-aware), `vp check`, `vp test`, `vp staged`,
  `.vite-hooks`, all configured in `vite.config.ts`. Never npm/yarn/pnpm/npx, ESLint, Prettier,
  Biome, Husky, lefthook, lint-staged, standalone oxlint/oxfmt, `tsc --noEmit` or
  `vitest.config.ts`.
- Dependencies pinned exactly; adding, removing or upgrading one needs the user's approval for
  that exact change. Package scripts change only when asked.
- Never hide a server import in client code with a dynamic import; fix the import graph.
- Surgical diffs. Smallest check that covers the change, then `bun run check` before done. Report
  static checks separately from runtime checks.

## Load

Read `~/.agentsync/skills/<name>/SKILL.md` (or this repo's `.agentsync/skills/<name>/SKILL.md`
before apply) when the task matches.

| When                                                         | Skill                         |
| ------------------------------------------------------------ | ----------------------------- |
| Any change (always)                                          | `lean`, `compliance`          |
| Package manager, scripts, lint, format, hooks, CI, deps      | `toolchain`                   |
| Tests of any kind                                            | `testing`                     |
| Bug, error, regression, incident, flaky test                 | `debugging`                   |
| Framework API, upgrade, "latest", official docs              | `source-driven-development`   |
| Public API, module boundary, SDK, webhook contract           | `api-and-interface-design`    |
| Security review, audit, pen test, vulnerability research     | `security-audit`              |
| Hono API routes, middleware, errors                          | `hono`                        |
| Drizzle schema, queries, migrations                          | `drizzle`, then `postgres`    |
| Postgres schema, indexes, RLS, performance, locking          | `postgres`                    |
| Better Auth: sessions, passkeys, 2FA, organizations, SSO     | `better-auth`                 |
| Supabase clients, auth, RLS, types, Edge Functions           | `supabase-auth-data`, then `postgres` |
| TanStack Start routes, loaders, server functions             | `tanstack-start-cloudflare`   |
| Server data in React: queries, mutations, cache              | `react-query-mutative`        |
| Forms, validation, `useForm`, Zod                            | `forms-rhf-zod`               |
| Client UI state (modals, sidebar, theme, selection)          | `zustand-x-ui-state`          |
| Tailwind, tokens, layout, motion, icons, accessibility       | `ui`                          |
| shadcn components, registries, presets                       | `shadcn` (after `ui`)         |
| Vite config, plugins, env exposure, SSR, packing             | `vite`                        |
| Cloudflare Workers, bindings, `wrangler.jsonc`               | `cloudflare`                  |

If a skill file is missing on this host, say so and stop guessing that stack.
