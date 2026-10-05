# Smells

Every smell has the shape: what it looks like, why it hurts, what to do instead. Examples are
TypeScript, React, Hono, Drizzle and Zod, the stack these rules were written against; the ideas
apply everywhere.

Contents:

1. Parse once, then trust the types
2. Hand-written types
3. One type end to end (null, undefined, '')
4. Copies of the same fact
5. Re-invention
6. Inconsistency
7. if/else chains and nesting
8. Speculative structure
9. Bug fixes that bloat
10. Tests that bend the design
11. DRY in both directions
12. Environment variables (see `env.md`)
13. React
14. Errors
15. Premature optimisation
16. Comments, docs and files
17. Outside code: questions, copy, tasks, rules
18. The deletion test
19. Where calls run: server first, and never without a session

---

## 1. Parse once, then trust the types

**Outside data** is parsed with Zod exactly once, where it enters:

- request bodies, query strings, headers, route params;
- webhook payloads and third-party API responses;
- environment variables (through the repo's env package only);
- `localStorage`, files, queues, JSON columns;
- anything typed `any` or `unknown`.

**Not outside data**, never re-checked:

- database rows through the ORM (typed by the schema);
- return values of our own functions;
- props between our own components;
- the result of a Zod parse;
- the session object from the auth library.

Bad:

```ts
const row = await db.query.project.findFirst({ where: eq(project.id, id) })
const name = typeof row?.name === 'string' ? row.name : undefined
const createdAt = row?.createdAt instanceof Date ? row.createdAt : new Date(String(row?.createdAt))
const health = row && 'healthData' in row ? Boolean(row.healthData) : false
```

Good:

```ts
const row = await db.query.project.findFirst({ where: eq(project.id, id) })
if (!row) throw notFound('Project')
const { name, createdAt, healthData } = row
```

Bad (the same body checked three times):

```ts
app.post('/keys', async (c) => {
	const body = await c.req.json()
	if (!body || typeof body !== 'object') return c.json({ error: 'bad' }, 400)
	if (typeof body.name !== 'string' || body.name.length === 0) return c.json({ error: 'name' }, 400)
	const input = createKeySchema.parse(body)
	return c.json(await createKey(input)) // and createKey() checks input.name again
})
```

Good:

```ts
app.post('/keys', async (c) => c.json(await createKey(await readJson(c, createKeySchema))))
```

Smells to delete on sight:

- `typeof x === 'string'` where `x: string`.
- `x ?? undefined`, `x || ''`, `x ?? []` where `x` cannot be nullish.
- `Array.isArray(x)` where `x: T[]`; `instanceof Date` on an ORM timestamp.
- `String(x)`, `Number(x)`, `Boolean(x)` on values already of that type.
- Optional chaining on non-optional values (`a?.b` where `a` is required).
- `as` casts and `!` assertions that silence the compiler instead of fixing the source type.
- "Defensive" checks inside private functions only typed callers reach.
- `try { JSON.parse } catch` repeated per call site instead of one schema with `z.string().transform`.

Why it matters: these checks are commonly 20 to 30 percent of a file. They change nothing at
runtime, because strict TypeScript already proves them, but every reader has to wonder why
they are there, and they hide the real checks at the edge.

## 2. Hand-written types

Every type derives from its one source:

| Source of truth           | Derive with                                                          |
| ------------------------- | -------------------------------------------------------------------- |
| Zod schema                | `z.infer<typeof s>`, `z.input<typeof s>`                             |
| Drizzle table             | `typeof t.$inferSelect`, `$inferInsert`, `drizzle-orm/zod` schemas   |
| Auth library              | its exported `Session`, `User` types                                 |
| A function                | `ReturnType`, `Parameters`, `Awaited`                                |
| A constant                | `typeof X`, `keyof typeof X`, `(typeof X)[number]` with `as const`   |
| A library                 | the library's exported types                                         |
| Generated code (OpenAPI)  | the generated types, never copied                                    |

Bad:

```ts
// in a component, while the API schema and the table already exist
type Project = { id: string; name: string; createdAt: string; healthData?: boolean }
type Role = 'owner' | 'admin' | 'member' // typed again instead of derived
```

Good:

```ts
type Project = z.infer<typeof projectResponse>
const ROLES = ['owner', 'admin', 'member'] as const
type Role = (typeof ROLES)[number]
```

Smells:

- A `type` or `interface` whose fields mirror a table or schema.
- A literal union typed again in several files.
- `ProjectRow`, `ProjectDto`, `ProjectModel`, `ProjectView`: the same shape four times.
- Mapping functions that copy fields one by one between identical shapes.

## 3. One type end to end (null, undefined, '')

A value has one type from the database to the screen. Every layer reuses it.

Bad:

```ts
type KeyRow = { id: string; name: string | null; expiresAt: Date | null }
type KeyDto = { id: string; name?: string; expiresAt?: string }
type KeyItem = { id: string; name: string; expiresAt: string | undefined }
const toDto = (r: KeyRow): KeyDto => ({ id: r.id, name: r.name ?? undefined, expiresAt: r.expiresAt?.toISOString() })
const toItem = (d: KeyDto): KeyItem => ({ id: d.id, name: d.name ?? '', expiresAt: d.expiresAt })
```

Good:

```ts
// the table is the truth
export const apiKey = pgTable('api_key', {
	id: text().primaryKey(),
	name: text().notNull(),
	expiresAt: timestamp({ withTimezone: true })
})
// the API response schema is derived from it
export const apiKeyResponse = createSelectSchema(apiKey).pick({ id: true, name: true, expiresAt: true })
// the client imports the same schema; one codec handles Date over the wire
type ApiKey = z.infer<typeof apiKeyResponse>
```

Rules:

1. The database schema is the source; API schemas derive from it; clients import them.
2. One "empty" per field, decided at the schema: nullable means `null` everywhere; if a value
   must exist, make it `notNull` with a default and the question disappears.
3. `?` (optional) only for keys that are genuinely absent, such as a PATCH body where a missing
   key means "do not change". Never as a second spelling of `null`.
4. Forms convert once, in the form's schema (`''` to `null` in one preprocess), never in each
   submit handler.
5. Subsets with `Pick`, `Omit`, `.pick()`, `.omit()`; never a new hand-written shape.
6. The only conversion is the one the wire forces (Date to ISO string and back), done by the
   schema, never by hand in components.

Smells: `?? undefined`, `?? null`, `|| ''`, `|| null`, `x === null ? undefined : x`,
`toDto`/`toModel`/`toView`, `string | null | undefined`, optional props that are always passed,
`Partial<T>` to dodge required fields.

## 4. Copies of the same fact

Same value, list, message, schema or path in several places means drift.

Typical copies:

- numbers: retention days, limits, prices, timeouts repeated as literals;
- marketing figures ("1,500+") typed in many components;
- lists: roles, categories, sign-in methods, subprocessors;
- error messages written inline in each route;
- a Zod schema defined in the API and again in the client;
- URLs and paths built by hand instead of one `projectPath()`;
- the same wording in a component and an email template.

Rule: every fact has one owner, exported and imported everywhere else. Search for the literal
before writing it; if it already exists, import it.

## 5. Re-invention

Hand-writing what a battle-tested library already does is over-engineering and a bug farm: the
home-made version misses the edge cases the library fixed years ago (time zones, Unicode,
collisions, retries, escaping, focus management). See `libraries.md` for the table.

Smells:

- A `utils/` file that grows forever.
- A function named like a library export: `formatDate`, `chunk`, `debounce`, `retry`, `sleep`,
  `uuid`, `deepEqual`, `groupBy`, `pick`, `omit`.
- "I wrote a small version so we do not need a dependency."
- A wrapper that only renames a library.
- Re-implementing an option the library already has, because its docs were not read.
- A custom dropdown, dialog, tooltip, toast or focus trap next to an installed component library.
- `useEffect` + `useState` data fetching next to an installed server-state library.

Hand-writing wins only when it is one or two clear lines (`array.at(-1)`), when no maintained
library exists, or when the library is far too large for one tiny use and the platform does it.

## 6. Inconsistency

The most damaging smell: every agent invents its own way and the codebase becomes ten
codebases. Nobody can trust any pattern.

Where it shows:

- several ways to fetch (raw fetch, ofetch, a custom client, query library, effects);
- several API error shapes;
- errors thrown here, returned as `Result` there, `null` elsewhere;
- dates as strings, `Date` objects and numbers in the same layer;
- `orgId`, `organizationId`, `org_id`, `organization` for the same thing;
- features in `services/`, `lib/` or route files at random;
- forms with and without the form library;
- a component-library dialog here, a hand-made modal there;
- logging, toasts, empty and loading states done differently per page;
- three styles of test setup.

Rule: copy the nearest existing pattern exactly. The closest sibling (same folder, same kind of
feature) wins. Never introduce a second way. If the existing way is wrong, keep it, or replace
it everywhere in one dedicated change after asking. Name the file you modelled each new piece
on. The repo's canonical file lists the one way per concern.

## 7. if/else chains and nesting

Bad:

```ts
let label
if (status === 'active') label = 'Active'
else if (status === 'revoked') label = 'Revoked'
else if (status === 'expired') label = 'Expired'
else if (status === 'rotating') label = 'Rotating'
else label = 'Unknown'
```

Good, smallest first:

```ts
// a lookup; a missing status fails to compile
const STATUS_LABEL = { active: 'Active', revoked: 'Revoked', expired: 'Expired', rotating: 'Rotating' } satisfies Record<KeyStatus, string>
const label = STATUS_LABEL[status]

// switch with an exhaustive check when each case does work
switch (event.type) {
	case 'created': return onCreated(event)
	case 'deleted': return onDeleted(event)
	default: return event satisfies never
}

// ts-pattern for shapes and several fields at once
match(result)
	.with({ ok: true }, ({ value }) => show(value))
	.with({ code: 'REAUTH_REQUIRED' }, () => reconnect())
	.exhaustive()
```

Also:

- early returns for failures, then a flat main path;
- no `else` after `return` or `throw`;
- no "Unknown" fallback for a closed set: exhaustiveness lets the compiler find the gap;
- no boolean parameters that switch a whole function's behaviour (`render(isAdmin, isMobile)`):
  split the function or pass data;
- no nested ternaries.

## 8. Speculative structure

- Interface or abstract class with one implementation.
- Factory with one product; builder for an object with three fields.
- Wrapper that only renames or forwards (`apiClient.get` around ofetch, `useProjects` that only
  calls `useQuery` with nothing added).
- Options, parameters and settings nobody passes.
- A layer (service, repository, manager, handler) with one caller that adds nothing.
- Folder with one file; file exporting one trivial thing; `index.ts` barrels re-exporting
  everything.
- Plugin systems, registries and event buses for two call sites.
- Generic types with one instantiation.
- "For later" scaffolding: empty hooks, TODO stubs, unused config keys.

Instead: write the direct code. Extract when the second real caller arrives with the same need.

## 9. Bug fixes that bloat

Bad behaviour:

- patching the symptom in the one caller named in the ticket while the others stay broken;
- special cases (`if (id === 'org_123')`, "if this connector then...");
- a new flag or option to toggle the fix;
- a workaround on top of a workaround;
- rewriting the module while fixing one line;
- catching the error and hiding it so the symptom disappears;
- leaving the old wrong path next to the new right one.

The rule:

1. Reproduce with a failing test.
2. Find the root cause; search every caller of the function you will touch.
3. Fix once, where all callers route through.
4. Delete the workarounds the bug caused.
5. The test passes and nothing else changed.

A bug fix that adds more than about 30 lines states why in the task notes.

## 10. Tests that bend the design

Smells:

- code shaped for the test: exported internals, dependency parameters, injected service bags,
  "test mode" flags, `setX` hooks only tests call;
- wrappers that exist only so a test can mock them;
- mocking our own modules instead of going through the public entry point;
- asserting which internal function was called, in which order;
- fixtures and helpers that grew into their own framework;
- snapshots nobody reads;
- one test per line instead of one per behaviour;
- testing the library (that Zod parses, that dates add);
- the same setup pasted into forty tests.

The rule: test behaviour at the boundary a real caller uses (HTTP route, exported function,
page); mock only the outside world (network, time, payment provider) with fakes; one test per
behaviour, named by what the user gets; a few honest shared helpers (seed an organization, sign
in as owner). If a test cannot be written without bending the design, fix or delete the test.

## 11. DRY in both directions

Too little:

- the same rule in three places (a notice period hard-coded in code, email and docs);
- copy-pasted schemas that drift;
- the same query pasted into five routes;
- two helpers doing the same thing under different names.

Too much (the wrong abstraction):

- merging two things that look alike today but change for different reasons;
- `BaseService`, `createHandler(config)`, `useGenericForm` with twelve options for three callers;
- extracting on the second occurrence "because it might repeat";
- hiding a simple flow behind configuration nobody can read.

The line: duplicated knowledge (a fact, rule, schema, permission) is merged at once.
Duplicated shape may stay until the third real occurrence with the same reason to change. When
an abstraction keeps gaining options and per-caller branches, inline it back.

## 12. Environment variables

See `env.md`. In short: only secrets, per-deployment values that cannot be derived, and
operator choices. Everything else is a constant.

## 13. React

- `useEffect` to compute something derivable during render: compute it inline.
- State copied from props: use the prop.
- `useMemo` and `useCallback` everywhere without a measured reason.
- Fetching in effects next to a server-state library.
- A context for a value one child uses; prop drilling through layers that do not use the value.
- Uncontrolled re-implementation of form state next to the form library.
- `key={index}` to silence a warning.
- Components with boolean props that turn them into different components.

## 14. Errors

- `catch (e) { console.error(e); throw e }`: delete the catch.
- Catching to return a vague message that hides the cause.
- Several error styles in one module (throw, `Result`, `null`). Use the repo's one style.
- Error classes per call site instead of one set of codes.
- Retrying non-idempotent or local operations.

## 15. Premature optimisation

Caches, pools, batching, queues, workers, memoisation, denormalisation or custom serializers
without a measurement that shows the need. Measure first; add the smallest fix; mark it with a
`lean:` comment naming the ceiling.

## 16. Comments, docs and files

- Comments that restate the code; comment the why, not the what.
- JSDoc on obvious functions.
- READMEs copying the spec or the code.
- A new markdown file for every task.
- One export per file, folders for one file, barrel files.
- Generated files edited by hand.

## 17. Outside code: questions, copy, tasks, rules

- **Too many questions.** Decide implementation details (error codes, internal names, limits
  that do not change what users see) and record the choice. Ask only about what users see, pay,
  are promised, new dependencies and security trade-offs.
- **Invented copy.** Never write on-screen text nobody approved; never restate a rule as UI text.
- **Over-applied rules.** A rule about marketing copy does not apply to a filter list; a rule
  about one page does not apply to all. Apply rules to what they were stated for.
- **Process bloat.** Ten tasks where one would do; a plan longer than the change; explanations
  longer than the code.

## 18. The deletion test

Ask of every line, file, layer, setting and dependency: if I delete this, does any user-visible
behaviour, security property or required guarantee change? If not, delete it.

Usual candidates: dead code, pass-through layers, checks the types guarantee, catch-and-rethrow,
restating comments, options nobody passes, triple validation, "just in case" retries and
fallbacks, tests of the framework or the mock.

Never deleted: validation at trust boundaries, auth and permission checks, tenant isolation,
error handling that prevents data loss, audit records, accessibility.

A deletion is its own change: it only deletes and merges, adds no features, and proves through
the existing tests that behaviour is unchanged. Report net lines removed.

## 19. Where calls run: server first, and never without a session

**Client calls that should be server calls.** Data fetched in the browser with `fetch`, `ofetch`
or `useQuery` against our own API, when a route loader or server function could do it.

```tsx
// Bad: the browser calls the API, the route and its shape are public, the session check is
// wherever the API remembered to put it, and every visitor's bundle carries the client
const { data } = useQuery({ queryKey: ['projects'], queryFn: () => api('/api/projects') })

// Good: one server function, session and input checked on the server, the loader prefetches
export const listProjects = createServerFn({ method: 'GET' })
	.middleware([requireSession])
	.handler(({ context }) => projects.list(context.session.organizationId))

export const Route = createFileRoute('/_authed/projects')({
	loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
})
```

Why the server is the default:

- Tokens, API keys, internal URLs and third-party calls never reach the bundle.
- The session and the input are checked where the user cannot change the code.
- No public route to protect, no CORS, fewer round trips, smaller bundle, data ready at first
  paint.

What stays in the browser: live updates (websocket, server-sent events), direct uploads to a
signed URL, third-party widgets that must call their own service, and purely local state.

Not the reason: making calls "harder to read". Server function requests are still visible in
the network tab. The protection is the server-side check, so every server function still
validates its input and checks the session and permission.

**Calls without a session.** Requests that need a user, sent when there is none.

```tsx
// Bad: every page, signed in or not, asks for the user and the organization
function SiteNav() {
	const me = useQuery({ queryKey: ['me'], queryFn: getMe })        // 401 on the marketing site
	const org = useQuery({ queryKey: ['org'], queryFn: getOrg })      // fires before me resolves
}

// Good: the session is read once on the server, the guard redirects before any data call
export const Route = createFileRoute('/_authed')({
	beforeLoad: async () => {
		const session = await getSession()
		if (!session) throw redirect({ to: '/sign-in' })
		return { session }
	},
})
// Public pages read the session from the root loader and simply do not render signed-in parts
```

Signs:

- 401 responses in the network tab for signed-out visitors, or on every page load.
- `/me`, `/session` or the organization fetched by several components on one screen.
- `if (!session) return null` repeated across components under a guarded layout.
- Polling or prefetching that keeps running after sign-out.

Fix: one guard at the route or layout; server functions read the session first and return or
throw before doing anything else; signed-out visitors trigger no signed-in calls.
