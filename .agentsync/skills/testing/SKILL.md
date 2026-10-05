---
name: testing
description: "Use when writing, reviewing, or running tests: unit and integration with vp test (Vitest inside Vite+, imports from vite-plus/test), component tests with Testing Library, end-to-end and browser flows with Playwright. Covers what to test, test-first loops for bugs, mocking boundaries, fakes, fixtures, and the rules that keep tests from bending the design."
---

# Testing

- **Unit and integration:** `vp test` (Vitest bundled in Vite+). Import from `vite-plus/test`.
- **Components:** Testing Library on top of `vp test` (jsdom or browser mode).
- **End to end:** Playwright.

Read `lean` first: tests serve the design, never the other way round.

## When to test

**Always:**

- Logic with branches: parsers, mappers, calculations, permission checks, money, dates.
- Every trust boundary: a request handler or server function, with valid input, invalid input,
  unauthenticated, forbidden, another tenant's resource.
- Every bug fix: a test that fails before the fix.
- Security-relevant behaviour: refusal paths, redaction, erasure, rate limits.

**When it is complex:** custom hooks with state, multi-step forms, conditional rendering that
changes what users can do, query key factories with logic.

**Never:**

- Pass-through components, re-exports, generated files.
- The framework or a library (that Zod parses, that dates add, that React renders).
- Styling (use visual checks in the browser suite instead).
- Thin hooks that call one function with no logic.

## The loop for bugs and risky changes

1. Write or adjust a test that fails for the bug or the requirement.
2. Run it alone and confirm it fails for the expected reason.
3. Make the smallest correct change.
4. Run it until it passes; refactor with it green.
5. Run the impacted tests and `bun run check` before saying done.

If test-first is impractical, say why and add the closest useful coverage before shipping.

## Files

- Colocated: `foo.ts` and `foo.test.ts`; `button.tsx` and `button.test.tsx`.
- End to end in `e2e/` (or the repo's existing folder), files `*.e2e.ts`.
- `.test.ts(x)` only; never `.spec.*` in new code unless the repo already uses it.
- One `describe` per exported unit; `it` names say what the user or caller gets.

## Unit tests

```ts
import { describe, expect, it } from 'vite-plus/test'
import { formatPrice } from './format-price'

describe('formatPrice', () => {
	it('formats cents as dollars', () => {
		expect(formatPrice(1500)).toBe('$15.00')
	})

	it('returns null for negative amounts', () => {
		expect(formatPrice(-100)).toBeNull()
	})
})
```

## Boundaries and mocks

- Test through the public entry point a real caller uses: the route, the server function, the
  exported function, the page.
- Mock only the outside world: network (with a fake server or `vi.fn` on the client's transport
  module), time (`vi.useFakeTimers`, `vi.setSystemTime`), randomness, external services, payment
  providers.
- Never mock our own modules to reach a line of code; never add parameters, exports, flags or
  wrappers only for tests (see `lean` section 10).
- Prefer in-memory fakes with real behaviour (a fake provider server, an in-memory database
  adapter) over deep `vi.mock` chains.
- `vi.restoreAllMocks()` in `afterEach` when spies are used; tests never depend on order.

```ts
import { afterEach, describe, expect, it, vi } from 'vite-plus/test'
import { app } from '../src/app'

afterEach(() => vi.useRealTimers())

describe('POST /keys/:id/rotate', () => {
	it('refuses a member of another organization', async () => {
		const res = await app.request('/keys/key_123/rotate', { method: 'POST', headers: otherOrgSession })
		expect(res.status).toBe(404)
	})

	it('stops the old key after the overlap', async () => {
		vi.useFakeTimers()
		// rotate, advance past the overlap, call with the old key, expect 401
	})
})
```

## Data

- Minimal test data: only the fields the assertion needs.
- Test data builders derive from the real types (`z.input<typeof schema>`, the table's insert
  type); never hand-written shapes that drift.
- Each test gets its own records (its own organization or user) so tests run in parallel.
- Never real credentials, real customer data or production endpoints.

## Component tests (Testing Library)

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vite-plus/test'
import { SearchInput } from './search-input'

describe('SearchInput', () => {
	it('calls onSearch with what the user typed', async () => {
		const user = userEvent.setup()
		const onSearch = vi.fn()
		render(<SearchInput onSearch={onSearch} />)
		await user.type(screen.getByRole('searchbox'), 'hello')
		expect(onSearch).toHaveBeenLastCalledWith('hello')
	})
})
```

- Query by role, then label, then text; test IDs only when nothing semantic exists.
- `userEvent`, not `fireEvent`; `screen`, not destructured queries.
- `findBy*` for async UI; never `waitFor` with arbitrary timeouts.
- Assert accessible names and states (`aria-pressed`, `aria-expanded`), which also tests
  accessibility.

## End to end (Playwright)

- Semantic locators (`getByRole`, `getByLabel`); never CSS selectors or XPath for user flows.
- Web-first assertions (`await expect(locator).toBeVisible()`); never `waitForTimeout`.
- Sign in once per test identity and reuse saved storage state; set data up through the API or
  database, not the UI, except in the test of that UI.
- One organization or account per test so tests run fully parallel.
- Fakes for third parties (OAuth providers, payment, email via a local catcher such as Mailpit).
- Traces on failure (`trace: 'retain-on-failure'`); accessibility scan with `@axe-core/playwright`
  on key pages.
- Agents run Playwright only where the repo and user allow browsers, against local or test
  environments, never production.

## Rules

- `it` inside `describe`; one behaviour per `it`.
- `toBeNull()`, `toBeUndefined()`, `toHaveBeenLastCalledWith()`; specific matchers over generic
  equality.
- No snapshot tests unless the snapshot is the contract (a generated file format, an email
  body).
- Never weaken or delete an assertion to make a change pass.
- Flaky test: find the cause (time, order, shared state, network); never add retries or sleeps.

See `references/testing-patterns.md` for test shape, fixtures, regression tests and coverage.
