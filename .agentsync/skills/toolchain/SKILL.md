---
name: toolchain
description: "Use before changing package management, scripts, formatting, linting, type checking, test runner setup, git hooks, commit messages, CI, or dependencies in a TypeScript repo. The one toolchain is Bun + Vite+ (vp): vp fmt, vp lint (type-aware), vp check, vp test, vp staged, .vite-hooks, vp run, vp pack."
---

# Toolchain: Bun + Vite+

One toolchain, configured in one file. Vite+ (`vite-plus`, command `vp`) bundles Vite, Oxfmt,
Oxlint with type-aware rules and type checking, Vitest, tsdown packing, a task runner with
caching, staged-file checks and a git hook dispatcher. Bun installs packages and runs scripts.

Researched against Vite+ 1.0 (viteplus.dev, 2026-10). Check `vp --version` and the official guide
before relying on a flag.

## Hard rules

- **Bun** for installing and running: `bun install`, `bun add -E <pkg>@<version>`,
  `bun run <script>`. Never npm, yarn, pnpm or npx. `bunx` only for one-off binaries the repo does
  not install.
- **Vite+** for format, lint, type check, test, build, pack, tasks and hooks. Never add ESLint,
  Prettier, Biome, Husky, lefthook, lint-staged, a standalone `oxlint`/`oxfmt` setup, a separate
  `tsc --noEmit` step or a `vitest.config.ts`.
- **One config file:** `vite.config.ts` with `defineConfig` from `vite-plus`. Keys: `fmt`, `lint`,
  `test`, `staged`, `run`, `pack`, plus normal Vite config. No `.oxlintrc.json`, `.oxfmtrc.json`
  or `.prettierrc` beside it.
- **TypeScript only** for JavaScript-platform source; `strict` on. No new `.js`/`.jsx` files.
- **Pinned dependencies:** exact versions (`bun add -E`), one committed lockfile (`bun.lock`).
  Adding, removing or upgrading a dependency needs the user's approval for that exact change.
- **Package scripts** change only when the user asks for tooling work.
- **Hooks are never bypassed** (`--no-verify` is forbidden).

## The config

```ts
// vite.config.ts
import { defineConfig } from 'vite-plus'

export default defineConfig({
	fmt: {
		useTabs: true,
		semi: false,
		singleQuote: true,
		trailingComma: 'none',
		printWidth: 100,
		ignorePatterns: ['**/dist/**', '**/*.gen.ts', 'bun.lock']
	},
	lint: {
		categories: { correctness: 'deny', suspicious: 'deny', perf: 'deny' },
		plugins: ['typescript', 'unicorn', 'react', 'jsx-a11y'],
		options: {
			typeAware: true,
			typeCheck: true,
			denyWarnings: true,
			reportUnusedDisableDirectives: 'deny'
		},
		rules: {
			'typescript/no-explicit-any': 'error',
			'typescript/no-non-null-assertion': 'error',
			'typescript/no-unsafe-type-assertion': 'error',
			'typescript/no-unnecessary-condition': 'error',
			'typescript/no-unnecessary-type-assertion': 'error',
			'typescript/switch-exhaustiveness-check': 'error',
			'typescript/no-floating-promises': 'error',
			'typescript/no-deprecated': 'error',
			'no-nested-ternary': 'error',
			'no-else-return': 'error'
		},
		ignorePatterns: ['**/dist/**', '**/*.gen.ts']
	},
	test: {
		include: ['**/*.test.{ts,tsx}'],
		exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**']
	},
	staged: {
		'**/*.{ts,tsx,css,json,jsonc,md,yaml,yml}': 'vp fmt --check --no-error-on-unmatched-pattern',
		'**/*.{ts,tsx}': 'vp lint --no-error-on-unmatched-pattern'
	}
})
```

- The formatting style is the default for new repos; an existing repo keeps its own `fmt`
  settings.
- The lint rules are the floor that enforces the `lean` skill mechanically
  (`lean/references/enforcement.md`). Add `no-restricted-imports` for the repo's banned modules
  (raw `fetch` where ofetch is standard, `process.env` outside the env package, a replaced icon
  set).
- Rule names follow Oxlint; verify a rule exists in the installed version before adding it
  (`vp lint --rules`).

## Scripts

```json
{
	"scripts": {
		"prepare": "vp config",
		"dev": "vp dev",
		"build": "vp build",
		"test": "vp test",
		"test:watch": "vp test watch",
		"test:e2e": "playwright test",
		"lint": "vp lint",
		"format": "vp fmt --write",
		"check": "vp check && vp test"
	}
}
```

- `vp check` runs format check, lint and type check together; `vp check --fix` applies formatting
  and safe lint fixes.
- `vp test` runs once; `vp test watch` watches.
- Monorepos: `vp run --filter './packages/*' build` runs a task across workspaces in dependency
  order with caching; `vp run --cache check` caches whole checks.
- Libraries: `vp pack` (tsdown) with a `pack` config; turn `publint` and `attw` to `error`.

## Git hooks

```sh
vp hooks enable   # installs the .vite-hooks dispatcher; "prepare": "vp config" keeps it installed
```

```sh
# .vite-hooks/pre-commit
vp staged
```

```sh
# .vite-hooks/pre-push
bun run check
```

Hook scripts in `.vite-hooks/` are committed; the generated dispatcher in `.vite-hooks/_` is
ignored. Commits fail on formatting or lint errors in staged files; pushes fail on the full check.

## CI (GitHub Actions)

```yaml
name: check
on: [push, pull_request]
permissions:
  contents: read
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v6
        with:
          node-version: 24
      - run: bun install --frozen-lockfile
      - run: bun run check
```

- Node 24 with `actions/setup-node@v6` (Vitest inside Vite+ needs a supported Node).
- `--frozen-lockfile` always; CI never resolves new versions.
- Least-privilege `permissions`; no secrets printed.

## TypeScript

- `strict: true`; keep `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` where the repo
  uses them; never loosen compiler options to make code compile.
- `type` over `interface`. No `any`; `unknown` plus one Zod parse at the edge (see `lean`).
- No `as` or `!` to silence errors; fix the source type.
- Every promise is awaited, returned, `void`ed with a reason, or handed to the runtime
  (`ctx.waitUntil`).
- No `@ts-ignore`, `@ts-expect-error` or lint disable without a reason comment on the same line.
- Named exports and imports; default export only where a framework requires it; never
  default-import React.
- Filenames lowercase kebab-case.

## Commits

- Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, optional
  scope, `!` for breaking changes.
- Agents commit or push only when the user asks in the current message; one push per request;
  warn before pushing to `main` or `master`.

## Verification

- Smallest check that covers the change first (`vp check <paths>`, `vp test <file>`), then
  `bun run check` before saying done.
- Report static checks (format, lint, types) separately from runtime verification (tests,
  browser).

## Migrating an existing repo to Vite+

1. Read the current setup: scripts, lint and format configs, hook manager, test runner.
2. Propose `vp migrate` (or a manual move) with the exact dependency changes; wait for approval.
3. Move settings into `vite.config.ts` (`fmt`, `lint`, `test`, `staged`); delete the old config
   files and dependencies (ESLint, Prettier, Husky, lefthook, lint-staged, standalone
   oxlint/oxfmt, `vitest.config.ts`).
4. Replace the hook manager with `.vite-hooks` and `"prepare": "vp config"`.
5. Switch test imports from `vitest` to `vite-plus/test`; `bun:test` suites move to `vp test`.
6. Run `bun run check`; fix failures in a dedicated change.
