---
name: react-query-mutative
description: "Use when fetching or mutating server data in React with TanStack Query v5: queryOptions and mutationOptions factories, query keys, QueryClient defaults, invalidation versus refetch, optimistic updates (UI-level or cache-level with mutative), concurrent mutations, prefetching in route loaders, and error handling."
---

# Server state: TanStack Query v5 (+ mutative for optimistic cache edits)

TanStack Query owns everything that comes from the server. Never mirror server data into React
state, context or a client store.

## The domain module

One folder per domain, three files, no wrapper hooks:

| File          | Contents                                                                    |
| ------------- | --------------------------------------------------------------------------- |
| `schemas.ts`  | Zod schemas; types derived with `z.infer`                                   |
| `requests.ts` | The calls (server functions or the app's ofetch client), typed from schemas |
| `queries.ts`  | Key factory, `queryOptions` and `mutationOptions`                           |

```ts
// src/api/contacts/queries.ts
import { mutationOptions, queryOptions } from '@tanstack/react-query'
import { createContact, getContact, listContacts } from './requests'
import type { ContactFilters } from './schemas'

export const contactKeys = {
	all: ['contacts'] as const,
	list: (filters: ContactFilters) => [...contactKeys.all, 'list', filters] as const,
	detail: (id: string) => [...contactKeys.all, 'detail', id] as const
}

export const contactListQuery = (filters: ContactFilters) =>
	queryOptions({ queryKey: contactKeys.list(filters), queryFn: () => listContacts(filters) })

export const contactQuery = (id: string) =>
	queryOptions({ queryKey: contactKeys.detail(id), queryFn: () => getContact(id) })

export const createContactMutation = () =>
	mutationOptions({ mutationKey: [...contactKeys.all, 'create'], mutationFn: createContact })
```

Components use them directly:

```tsx
const { data } = useSuspenseQuery(contactQuery(id))
const create = useMutation({
	...createContactMutation(),
	onSettled: () => queryClient.invalidateQueries({ queryKey: contactKeys.all })
})
```

- `queryOptions`/`mutationOptions` give one typed definition reused by components, loaders
  (`ensureQueryData`) and prefetching. A `useContacts()` hook that only calls `useQuery` is a
  wrapper (`lean`): do not write it. Write a hook only when it adds logic.
- Keys are hierarchical arrays from one factory per domain; include every input the result
  depends on (filters, IDs, tenant if it can change in-session).
- Types flow from the request function's return type; never annotate `useQuery<Contact[]>` by hand.

## QueryClient

One client per request on the server (SSR) and one per app in the browser; never a module-level
singleton shared across requests.

Pick freshness deliberately and write it down in the provider file:

- **Default (most apps):** keep TanStack's defaults and set `staleTime` per query family (for
  example 30 s for lists, `Infinity` for reference data). Refetch on focus stays on.
- **Manual freshness (dashboards where every write goes through the app):** `staleTime: Infinity`,
  `refetchOnWindowFocus: false`, `retry: false` for mutations, and every mutation invalidates
  what it changed. Only choose this when no one else writes the data.

Errors:

- Global `QueryCache.onError` and `MutationCache.onError` show a toast with the API's message for
  unexpected errors; expected errors (validation, conflict) are handled where they happen and
  marked with `meta: { silent: true }` so the global handler skips them.
- Never show raw error objects or stack traces.

## After a mutation

- `invalidateQueries({ queryKey })`: marks stale and refetches active queries. The default after
  most mutations.
- `refetchQueries`: refetches now even if nothing is mounted. Use when the next screen (after a
  redirect) must already be fresh.
- `setQueryData`: when the server returns the updated record, write it into the detail query to
  avoid a round trip, then invalidate lists.
- With route loaders (TanStack Router), also `router.invalidate()` when loader data depends on the
  changed data.

## Optimistic updates

Prefer the simplest form that works:

1. **UI-level (default):** render `mutation.variables` while `isPending` next to the list. No cache
   surgery, nothing to roll back.

```tsx
const create = useMutation(createContactMutation())
// in the list: if (create.isPending) render a pending row from create.variables
```

2. **Cache-level (when several components must show the pending change):** cancel, snapshot,
   edit with mutative, roll back on error, invalidate on settle.

```ts
import { create } from 'mutative'

useMutation({
	...renameContactMutation(),
	onMutate: async ({ id, name }) => {
		await queryClient.cancelQueries({ queryKey: contactKeys.detail(id) })
		const previous = queryClient.getQueryData(contactKeys.detail(id))
		if (previous) {
			queryClient.setQueryData(contactKeys.detail(id), create(previous, (draft) => { draft.name = name }))
		}
		return { previous }
	},
	onError: (_error, { id }, context) => {
		queryClient.setQueryData(contactKeys.detail(id), context?.previous)
	},
	onSettled: (_data, _error, { id }) => queryClient.invalidateQueries({ queryKey: contactKeys.detail(id) })
})
```

- `getQueryData` is typed from the `queryOptions` key; no casts.
- mutative is used only for immutable edits of cached data; never for app state.

## Rapid successive mutations (editors, builders)

- Share one `mutationKey` across related mutations.
- Only invalidate when the last pending one settles:
  `if (queryClient.isMutating({ mutationKey }) === 1) invalidate()`.
- Never let an older response overwrite a newer optimistic value: skip `setQueryData` from a
  response that is not the latest.

## Loading data with routes

- Route loaders call `queryClient.ensureQueryData(contactQuery(id))`; components read with
  `useSuspenseQuery(contactQuery(id))`. Never `useLoaderData` for query data.
- Prefetch on hover or intent with `queryClient.prefetchQuery(...)`.

## Never

- Server data in `useState`, context or zustand.
- `useEffect` + `fetch` for data.
- Hand-written response types or keys built as strings.
- Wrapper hooks that only forward to `useQuery`/`useMutation`.
- Swallowing errors to keep the UI green.
