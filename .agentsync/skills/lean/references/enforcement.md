# Enforcement: make the machines catch it

Agents forget prose; they cannot ignore a failing check. Every rule that a tool can check
belongs in the repo's check command (`bun run check` or equivalent), so "done" means "passed".

## Type-aware lint (Vite+ `lint` in `vite.config.ts`; see the `toolchain` skill)

| Rule                                   | Catches                                                         |
| -------------------------------------- | --------------------------------------------------------------- |
| no-unnecessary-condition               | checks on values the types already guarantee (`recheck:`)       |
| no-unnecessary-type-assertion          | `as` and `!` that change nothing                                |
| no-non-null-assertion                  | `!` used to silence the compiler                                |
| switch-exhaustiveness-check            | non-exhaustive switches                                         |
| no-nested-ternary                      | nested ternaries                                                |
| no-else-return                         | `else` after `return`                                           |
| prefer-nullish-coalescing (careful)    | `||` where `??` is meant                                        |
| no-restricted-imports / globals        | raw `fetch`, `process.env` outside the env package, banned libraries, hand-made helpers that a library replaces |
| no-explicit-any                        | `any` instead of `unknown` plus a parse                         |
| consistent-type-definitions (`type`)   | `interface` where the repo uses `type`                          |

## Dead code and dependencies

knip (or equivalent): unused files, exports, types, dependencies. Fails the check.

## Duplicates

- A copy-paste detector (jscpd or equivalent) over source, with a threshold.
- A small repo script for what linters miss:
  - the same number, string or list literal defined in more than one module;
  - `type`/`interface` declarations whose fields equal a Drizzle table or Zod schema;
  - more than one API error shape;
  - environment variables declared but never set in any deploy config.

## Change budgets

The review step (or CI) flags, for human attention:

- a bug fix adding more than about 30 lines;
- a change adding a new file, environment variable, dependency or abstraction without a note
  saying why.

## Rollout

Turn rules on one at a time; fix existing violations in dedicated deletion changes (they only
delete and merge, tests prove nothing changed), then make the rule fail the check so it never
comes back.
