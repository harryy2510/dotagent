---
name: tanstack-start-cloudflare
description: "Use when building routes, layouts, breadcrumbs, Fast Refresh-safe boundaries, server functions, error handling, metadata, or deployment config in a TanStack Start app deployed to Cloudflare Workers."
---

## Routing

File-based routing via TanStack Router. Router context type: `{ queryClient, session, user }`.

`getRouter()` must create a new router instance per request/session. Do not import a singleton router into server code.

Root `beforeLoad` primes auth via `ensureQueryData`. Route loaders prime cache with `ensureQueryData`, components read via `useQuery()` — NEVER `useLoaderData()`.

Links: `<Link to="/items/$id" params={{ id }} search={{ tab: 'details' }} />` — never template strings.

Never run TanStack Router CLI generation manually — `bun run dev` generates the route tree automatically.

## Fast Refresh Boundaries

When TanStack Start SSR runs through `@cloudflare/vite-plugin`, the SSR environment is backed by workerd/Miniflare. Bad HMR invalidation is expensive because SSR updates swap a Worker runtime, not a plain Node module.

TSX files that export React components or hooks must not also export runtime helpers. In route TSX modules, the only tolerated route export is TanStack `Route`.

Do not export these from React TSX modules:

- `validateSearch` schemas
- loaders or preload functions
- route data helpers
- `head` or metadata builders
- constants used by routes
- tab value arrays and guards
- class or variant helpers
- label, title, or path builders
- server functions

Move those helpers into colocated `.ts` modules named by responsibility:

- `route-data.ts`
- `*-loader.ts`
- `*-search.ts`
- `*.variants.ts`
- `*.styles.ts`
- `*-labels.ts`
- `*-meta.ts`

Avoid vague module names like `copy`, `utils`, or `helpers` unless the existing local pattern already uses them.

Before finishing route or component work, run `bun check:fast-refresh`, then the repo's normal smallest relevant check, usually `bun lint:check` or `bun check`. If the guard fails, split the TSX export boundary instead of suppressing the check.

## Layouts

Two layout routes:

1. **`_auth.tsx`** — guest-only. Redirects to `/dashboard` if logged in. Renders `<AuthLayout />` (centered card, no chrome).
2. **`_authed.tsx`** — protected. Redirects to `/login?redirect=current` if not logged in. Renders `<AppSidebar />` + `<AppTopBar />` with breadcrumbs.

Layout components live in `src/components/app/`: `app-sidebar.tsx`, `app-topbar.tsx`, `auth-layout.tsx`.

## Breadcrumbs

No `useEffect`, no global state. Routes declare breadcrumbs in `staticData`. Dynamic labels via `routeContext` in `beforeLoad`. Keep route data implementation in colocated `.ts` files and have the route TSX wire those functions into `Route`.

```tsx
// Route definition with breadcrumb
import { getProjectRouteContext, loadProjectRoute } from './project-route-data'

export const Route = createFileRoute('/_authed/projects/$id')({
  staticData: { breadcrumb: 'Project Details' },
  beforeLoad: getProjectRouteContext,
  loader: loadProjectRoute,
})
```

```tsx
// useBreadcrumbs hook
function useBreadcrumbs() {
  const matches = useMatches()
  return matches
    .filter((m) => m.staticData?.breadcrumb || m.context?.breadcrumb)
    .map((m) => ({
      label: m.context?.breadcrumb ?? m.staticData.breadcrumb,
      path: m.pathname,
    }))
}
```

`<Breadcrumbs />` renders inside `AppTopBar` automatically.

## Metadata & Head

Root route sets defaults: charset, viewport, title, description, theme-color, favicon links, manifest. Per-route title overrides via `head` function. Put nontrivial title, label, and metadata builders in a colocated `*-meta.ts` module and wire them into `Route`. Static assets in `public/`: `favicon.ico`, `icon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest`.

## Server Functions

Server functions are callable across the network boundary. Treat every input as untrusted even when a route guard exists.

Never declare `createServerFn` in `.tsx`. Put server functions in the API/data layer or a `.ts` route-data module. Do not paper over client/server boundary issues with dynamic imports; fix the import graph.

```ts
// src/api/items/functions.ts or src/routes/-items/route-data.ts
import { createServerFn } from '@tanstack/react-start'

export const getItems = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ cursor: z.string().optional() }))
  .handler(async ({ input }) => {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase.from('items').select('*')
    if (error) throw error
    return data
  })
```

- Input validation: `.inputValidator(schema)` — NEVER `.validator()`.
- Errors: `throw new Error(message)` — caught by global `MutationCache` → toast.
- Route guards improve UX, not security. Sensitive server functions must enforce authorization through Supabase RLS, scoped queries, or explicit server-side session/role checks.
- Do not duplicate auth checks only when a shared server helper already proves the same invariant and RLS still protects the table.
- Always use `getSupabaseServerClient()` — never `createClient()` or the browser client.

## Error Handling

- Route-level `errorComponent` on layout routes (`_authed.tsx`, `_auth.tsx`).
- Global `notFoundComponent` on root route.
- Per-route `errorComponent` overrides as needed.

## Vite Config

```ts
import { cloudflare } from '@cloudflare/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
})
```

NEVER use `app.config.ts` or vinxi.

## Deployment

Cloudflare Workers only (not Pages). Config in `wrangler.jsonc`. Deploy scripts live in CI — not in package.json.
