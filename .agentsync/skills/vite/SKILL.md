---
name: vite
description: "Use when working on vite.config.ts or Vite behaviour in a Vite+ project: defineConfig from vite-plus, plugins and plugin order, resolve aliases, dev server and proxy, environment variables and what reaches the client, import.meta.glob and asset queries, SSR and the Environment API, library builds with vp pack, Vite 8 with Rolldown and Oxc, and migration from older Vite setups."
---

# Vite (inside Vite+)

Vite 8 runs inside Vite+. The config file is `vite.config.ts` with `defineConfig` from
`vite-plus`; Vite's own options sit next to the Vite+ keys (`fmt`, `lint`, `test`, `staged`, `run`,
`pack`) described in `toolchain`. Read `https://vite.dev/` and `https://viteplus.dev/` for exact
behaviour; this skill is the map.

## Hard rules

- `import { defineConfig } from 'vite-plus'` (Vite+ also re-exports Vite APIs: prefer
  `vite-plus` imports over `vite` where the lint plugin asks for it).
- Commands through Vite+: `vp dev`, `vp build`, `vp preview`, `vp pack`; never bare `vite` scripts.
- ESM and TypeScript only; no CommonJS config.
- **`VITE_` variables are public:** they are inlined into the client bundle. Never a secret behind
  that prefix. Server secrets go through the runtime's secret store and the repo's one env module.
- Agents never read `.env*` files; they name variables and let the user set values.
- Convert `import.meta.env` strings explicitly (validate with the env module's schema), never
  `Number(import.meta.env.X)` scattered in code.

## Config shape

```ts
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite-plus'

export default defineConfig({
	plugins: [react()],
	resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
	server: { port: 3000, proxy: { '/api': 'http://127.0.0.1:8787' } },
	build: { target: 'es2022', sourcemap: true },
	// fmt, lint, test, staged, run, pack: see the toolchain skill
})
```

- Prefer `tsconfig` paths through `resolve.tsconfigPaths` or one alias; never several alias
  systems.
- Plugin order matters: framework plugins (`cloudflare`, `tailwindcss`, `tanstackStart`, `react`)
  follow their docs; use `enforce: 'pre' | 'post'` only for your own plugins.
- Conditional config with `defineConfig(({ command, mode }) => ({ ... }))` only when dev and build
  truly differ.

## Topics

| Topic                         | Reference                                         |
| ----------------------------- | ------------------------------------------------- |
| Config, `loadEnv`, conditional config | [core-config](references/core-config.md)  |
| `import.meta.glob`, `?raw`/`?url`, `import.meta.env`, HMR API | [core-features](references/core-features.md) |
| Plugin API, virtual modules, ordering | [core-plugin-api](references/core-plugin-api.md) |
| Library mode, SSR, JavaScript API | [build-and-ssr](references/build-and-ssr.md)  |
| Environment API (multi-runtime, Workers) | [environment-api](references/environment-api.md) |
| Vite 8: Rolldown, Oxc, config migration | [rolldown-migration](references/rolldown-migration.md) |

## Libraries

Use `vp pack` (tsdown) with a `pack` config instead of Vite library mode for packages: ESM output,
`.d.ts`, `deps.neverBundle` for dependencies, `publint` and `attw` set to `error`, dedicated
`exports` subpaths per entry (no catch-all barrel).

## Environment variables in Vite

- Only `VITE_`-prefixed values reach `import.meta.env` in client code.
- Validate them once in the env module (for example `@t3-oss/env-core` with Zod) and import the
  typed object everywhere else.
- `mode` selects `.env.[mode]` files; the user owns those files.
- Bun loads `.env` files into `process.env` for scripts; when debugging precedence, ask the user,
  do not read the files.

## Workers and SSR

- Cloudflare: `@cloudflare/vite-plugin` runs the SSR environment in workerd during `vp dev`; see
  `tanstack-start-cloudflare` and `cloudflare`.
- SSR-only modules never import from client modules that touch `window`; client-only code runs in
  effects or client entry points.

## Migrating

- From Vite 5/6/7: read `references/rolldown-migration.md` (Rolldown replaces Rollup and esbuild;
  Oxc replaces esbuild transforms; some `build.rollupOptions` move).
- From plain Vite to Vite+: `toolchain` → "Migrating an existing repo to Vite+".
