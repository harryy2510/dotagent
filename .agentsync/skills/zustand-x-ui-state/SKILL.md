---
name: zustand-x-ui-state
description: "Use when deciding where client state lives in React (URL, component state, form, server cache, or a store) and when creating or changing zustand-x v6 stores for shared UI state: sidebars, modals, selections, view preferences, theme. Covers the state boundary table, store shape, selectors and actions, theme without a flash, and what never goes in a store."
---

# Client UI state: zustand-x v6

Most state does not need a store. Pick the first row that fits:

| State                                                     | Lives in                                  |
| --------------------------------------------------------- | ----------------------------------------- |
| Anything that should survive a refresh or a shared link (tabs, filters, search, pagination, selected item) | URL search params (TanStack Router `validateSearch`) |
| Data from the server                                      | TanStack Query                            |
| Form fields, validation, dirty state                      | react-hook-form                           |
| Used by one component (open/closed, hover, local input)   | `useState` in that component              |
| Shared by distant components and not in the URL (sidebar collapsed, active modal, command palette, theme, multi-select across a list) | a zustand-x store |

Import from `zustand-x` (v6+), never `@zustand-x/core`.

## A store

```ts
// src/stores/ui-store.ts
import { createStore } from 'zustand-x'

type ModalId = 'invite' | 'rename-project' | 'delete-project'

type UiState = {
	sidebarOpen: boolean
	modal: { id: ModalId; payload: { projectId: string } } | null
}

const initialState: UiState = { sidebarOpen: true, modal: null }

export const uiStore = createStore(initialState, { name: 'ui', mutative: true })
	.extendSelectors(({ get }) => ({
		isModalOpen: (id: ModalId) => get('modal')?.id === id
	}))
	.extendActions(({ get, set }) => ({
		toggleSidebar: () => set('sidebarOpen', !get('sidebarOpen')),
		openModal: (modal: NonNullable<UiState['modal']>) => set('modal', modal),
		closeModal: () => set('modal', null)
	}))
```

- The state type is the one source; selectors and actions derive from it.
- Closed sets as unions (`ModalId`), never `string`; payloads typed per use, never
  `Record<string, unknown>`.
- One store per concern (`ui-store.ts`, `selection-store.ts`); no god store.
- Stores are created per app instance in SSR apps where state could leak between requests
  (create inside a provider), never as server-side module singletons holding user data.

## Reading and writing

```ts
import { useStoreValue, useStoreState } from 'zustand-x'

const open = useStoreValue(uiStore, 'sidebarOpen')            // one field, re-renders on change
const isInviteOpen = useStoreValue(uiStore, 'isModalOpen', 'invite') // selector with argument
const [modal, setModal] = useStoreState(uiStore, 'modal')     // value and setter

uiStore.set('toggleSidebar')                                  // action
uiStore.get('sidebarOpen')                                    // outside React
```

- Read the narrowest field or selector; never subscribe to the whole state.
- `useTracked` only for deep objects where proxy tracking measurably reduces re-renders.
- Actions hold the logic; components call actions, not `set` with inline logic.

## Theme without a flash

1. A tiny blocking script in `<head>` reads the saved mode (`localStorage`) and the system
   preference and sets the `dark` class and `color-scheme` before paint.
2. The store holds `{ mode: 'auto' | 'light' | 'dark', resolved: 'light' | 'dark' }` after
   hydration; `setThemeMode` persists, resolves and applies the class.
3. In `auto`, a `matchMedia('(prefers-color-scheme: dark)')` listener updates `resolved`.

Theme is the one store value persisted to `localStorage` (a per-device preference). Wrap storage
access in `try`/`catch`; the app must work when storage is blocked.

## Never in a store

- Server data, the session or the user (TanStack Query, the auth library).
- Form values (react-hook-form).
- Anything that belongs in the URL.
- Secrets, tokens or personal data persisted to `localStorage`.
- Derived values (compute them in a selector).
