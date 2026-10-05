---
name: lean
description: 'Always-on rules against over-engineering, re-invention and inconsistency, for every agent and every kind of work (code, tests, config, docs, design, backlog). One source reused everywhere; parse once at the edge and trust the types; libraries before hand-written code; copy the nearest existing pattern; delete what does not change behaviour or security; data calls on the server first, and never without a session. Also the review modes: "lean review" (a diff), "lean audit" (a repo), "lean env" (environment variables), "lean ledger" (deliberate shortcuts). Use for any implementation, refactor, bug fix, test, review or plan, and when the user says "over-engineered", "bloat", "simplify", "what can we delete", "lean review", "lean audit".'
---

# Lean

> **One source, reused everywhere. Parse once at the edge. Trust the types after that.
> Use the library, copy the existing pattern, delete what changes nothing.**

Always on. One standard, no levels. Applies to code, tests, configuration, docs, design and
backlog work alike.

## Before writing anything

1. **Understand first.** Read the task and every file the change touches. Trace the real flow end
   to end. Small changes in the wrong place are a second bug; being lean never shortens the reading.
2. **Reuse search.** Search the codebase for the function, component, type, constant, schema or
   pattern you are about to write. Name the existing file you are modelling the change on. If you
   cannot name one, you are probably inventing a new pattern: stop and look again.
3. **Read the repo's canonical file** if it has one (`docs/canonical-patterns.md` or
   `CANONICAL.md`): the one way per concern. Follow it exactly.

## The ladder

Stop at the first step that holds:

1. **Does this need to exist?** No real, current need: do not build it. "Later" is not a need.
2. **Does this codebase already do it?** Reuse it, the same way it is used elsewhere.
3. **Does an installed library do it?** Use it, the way its docs show.
4. **Does the platform do it?** Web APIs, CSS, the database (constraints, defaults, row-level
   security), the runtime.
5. **Does a mature library we do not have do it?** Propose it with an exact version and ask.
   Asking beats hand-rolling.
6. **Only then write code**, the smallest code that is correct, secure and readable.

## The rules

1. **One source per fact.** Every type, schema, constant, list, message, path and rule has one
   owner; everything else imports or derives it. A value defined twice is a bug.
2. **One type end to end.** Types are derived (`z.infer`, `$inferSelect`, `drizzle-orm/zod`,
   `ReturnType`, `typeof`, `Pick`, `Omit`), never hand-written. A field has one shape and one
   "empty" (`null` or required) from the database to the screen. No `null`/`undefined`/`''`
   conversions between layers.
3. **Parse once at the edge.** Outside data (request, webhook, third-party response, storage,
   `unknown`) is parsed with Zod exactly once. After that, no `typeof`, `??`, `?.`, `instanceof`,
   `String()`, `as` or `!` on typed values. Database rows and our own return values are not
   outside data.
4. **Libraries, not re-invention.** Never hand-write what a battle-tested library does: dates,
   IDs, validation, HTTP, collections, forms, server state, UI primitives, crypto.
   See `references/libraries.md`.
5. **Consistency over preference.** Copy the nearest existing pattern exactly: names, layout,
   errors, data fetching, components, tests. Never add a second way to do something. If the
   existing way is wrong, change it everywhere in one dedicated change, after asking.
6. **Flat, exhaustive branching.** Lookup tables with `satisfies Record<...>`, `switch` with an
   exhaustive `never` check, or `ts-pattern`; early returns; no `else` after `return`; no
   "Unknown" fallback for a closed set.
7. **No speculative structure.** No interface with one implementation, factory with one product,
   wrapper that only renames or forwards, option nobody passes, layer with one caller, folder
   with one file, scaffolding "for later".
8. **Environment variables only for secrets, per-deployment values that cannot be derived, or
   operator choices.** Everything else is a constant in code. See `references/env.md`.
9. **DRY knowledge, not shapes.** Merge duplicated facts and rules at once. Leave code that only
   looks alike until the third real occurrence; prefer duplication over the wrong abstraction.
10. **Tests serve the design.** Test behaviour at the public boundary; mock only the outside
    world; never shape code for a test (exported internals, dependency parameters, wrappers to
    mock, test flags).
11. **Bug fixes at the root, once.** Reproduce with a failing test, search every caller, fix where
    they all route through, delete the workarounds. A fix is usually smaller than the bug.
12. **Decide, do not ask, about implementation details.** Ask only when the answer changes what
    a user sees, pays or is promised, or needs a new dependency or a security trade-off.
13. **Apply a rule to what it was stated for.** Do not stretch a rule to cases that only look
    similar; ask when unsure.
14. **Server first.** Data is loaded and changed on the server: route loaders and server
    functions (TanStack Start `createServerFn`, or the framework's equivalent). The browser calls
    an API directly only for what must happen in the browser (live updates, a direct upload to a
    signed URL, a third-party widget). Server functions keep tokens, keys, internal URLs and
    third-party calls out of the bundle, check the session and the input on the server, and need
    no public route or CORS. Hiding a call from the network tab is not the protection; the
    server-side check is.
15. **No call without a session.** Signed-in screens check the session once, at the route guard
    or layout, and redirect before any data call. Calls that need a user never fire for a
    signed-out visitor (no 401s on public pages, no `/me` on every marketing page). Server
    functions read the session first and stop there. Components do not re-check it.

## The floor: never "simplify" away

Validation at trust boundaries, authentication and authorization (the server-side check stays
even when a route guard already redirects; the guard is for the screen, the server check is the
security), tenant isolation, error
handling that prevents data loss, audit records, accessibility, compliance requirements, and
anything the user explicitly asked for. Lean means less code, never less safety.

## Deliberate shortcuts

When you knowingly cut a corner with a real ceiling, mark it so it cannot rot:
`// lean: <the limit>, <when to upgrade>` (for example
`// lean: one global lock, per-account locks if throughput matters`). `lean ledger` collects them.

## One small check

Real logic (a branch, a parser, money, security, permissions) leaves one runnable check behind:
the smallest test that fails if the logic breaks. Trivial one-liners need none.

## Before saying "done"

Answer each, then fix what fails:

1. Did I search first, and name the existing pattern I copied?
2. Is outside data parsed once, and is everything after it trusted with no re-checks?
3. Did I hand-write any type, or convert between `null`, `undefined` and `''`?
4. Does any value, list, message, schema, path or type now exist in two places?
5. Did I hand-write anything a library or the platform does?
6. Any if/else chain that should be a lookup, `switch` or `match`?
7. Did I add a file, setting, environment variable, dependency, option or layer nobody asked
   for?
8. **What can I delete without changing behaviour or security?** Delete it.
9. Is the bug fix at the root, for every caller, with the workaround gone?
10. Do the tests test behaviour without bending the design?
11. Did I ask only what I truly could not decide?
12. Does any data call run in the browser that could be a loader or server function?
13. Can any call that needs a user fire without a session?

## Output

Code first, then at most three short lines: what was deliberately left out and when to add it.
No essays defending a simplification. Explanations the user asked for are not bloat.

## Modes

| Say                        | Does                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------ |
| `lean review`              | Reviews a diff for everything above; one line per finding. `references/review.md`     |
| `lean audit`               | The same across the whole repo, ranked by lines saved.                               |
| `lean env`                 | Lists every environment variable with its test, and which become constants.          |
| `lean ledger`              | Collects every `lean:` shortcut comment, flags ones with no upgrade trigger.          |

Review modes report only; they change nothing unless asked.

## References

- `references/smells.md`: every smell with bad and good examples.
- `references/libraries.md`: what to use instead of hand-writing.
- `references/env.md`: environment variable rules and audit.
- `references/review.md`: review, audit, env and ledger formats and tags.
- `references/enforcement.md`: lint rules and checks that catch these mechanically.
