# Review modes

All modes report only. They change nothing unless the user asks for the fixes.

## lean review (a diff) and lean audit (a repo)

One line per finding:

`<file>:L<line>: <tag> <what>. <replacement>.`

Tags:

| Tag          | Finds                                                                                         | Replacement                                   |
| ------------ | --------------------------------------------------------------------------------------------- | --------------------------------------------- |
| `delete:`    | Dead code, unused option or flag, speculative feature                                          | Nothing                                       |
| `recheck:`   | Runtime check on an already-typed value (`typeof`, `??`, `?.`, `instanceof`, `String()`, `as`, `!`) | Nothing; the type already guarantees it  |
| `retype:`    | Hand-written type mirroring a schema, table, function or constant                              | Name the source and the derivation            |
| `convert:`   | `null` / `undefined` / `''` conversions or field-by-field mapping between layers               | Fix the one type at its source                |
| `copy:`      | The same fact (number, list, message, schema, path, type) defined twice                         | Name the one owner to import                  |
| `reinvent:`  | Hand-written thing a library or the platform does                                              | Name the library function or platform API     |
| `drift:`     | A second way of doing something the repo already does one way                                  | Name the existing pattern and file            |
| `branch:`    | if/else chain, nested ternary, deep nesting                                                    | Lookup table, exhaustive `switch`, `match`, early return |
| `wrap:`      | Wrapper or layer that only renames or forwards                                                 | Call the thing directly                       |
| `yagni:`     | Abstraction with one implementation, config nobody sets, layer with one caller                 | Inline it                                     |
| `testbend:`  | Code shaped for a test: exported internals, dependency parameters, test flags, mock wrappers    | Test through the public boundary              |
| `env:`       | Environment variable that fails the three tests in `env.md`                                    | Constant, or derive from X                    |
| `fixbloat:`  | Bug fix patching a symptom, special case or workaround on a workaround                          | The root-cause fix for all callers            |
| `client:`    | Data loaded or changed from the browser that could be a loader or server function; a token, key or internal URL in client code | Loader or server function            |
| `nosession:` | A call that needs a user fired without a session (signed-out visitor, before the guard), or the session re-checked in components | Route guard once; server function checks first |
| `shrink:`    | Same logic, fewer lines                                                                        | Show the shorter form                         |

Examples:

- `keys.ts:L42-49: recheck: typeof checks on a Drizzle row. Delete; use the row's fields.`
- `project-card.tsx:L3: retype: Project type mirrors projectResponse. z.infer<typeof projectResponse>.`
- `settings.tsx:L88: convert: description ?? undefined. Keep null end to end; component prop is string | null.`
- `billing.ts:L12: copy: 30-day notice literal, also in email.ts:L40. Import NOTICE_DAYS from subprocessors.ts.`
- `relative-time.ts:L1-40: reinvent: hand-written relative time. date-fns formatDistanceToNow.`
- `routes/x.ts:L20: drift: c.json({ error }) instead of fail(). Use fail() from http.ts.`
- `status.ts:L5-19: branch: if/else on status. Record<KeyStatus, string> lookup.`
- `projects.tsx:L14: client: useQuery fetches /api/projects from the browser. Route loader with a createServerFn.`
- `site-nav.tsx:L9: nosession: useQuery(me) runs on public pages, 401 for every visitor. Read the session in the root loader; skip for signed-out.`

Order findings by lines saved, biggest first. End with:

`net: -<N> lines, -<M> files, -<K> dependencies, -<E> env vars possible.`

Nothing to cut: `Lean already. Ship.`

Scope: complexity, re-invention and inconsistency. Correctness and security bugs found along
the way are listed separately at the end under `Also found (not lean):`, never mixed in.

## lean env

See `env.md`.

## lean ledger

Collect every deliberate-shortcut comment:

`grep -rnE '(#|//) ?lean:' . --exclude-dir={node_modules,.git,dist}`

One row per marker: `<file>:<line>, <what was simplified>. ceiling: <limit>. upgrade: <trigger>.`
Flag markers with no upgrade trigger as `no-trigger`. End with `<N> markers, <M> with no trigger.`
