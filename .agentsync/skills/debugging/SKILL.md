---
name: debugging
description: "Use when investigating a bug, crash, error message, failing or flaky test, regression, performance problem, production incident, or when verifying that a fix really addresses the original symptom. A user reporting a bug means: investigate, fix the root cause and verify, not just diagnose."
---

# Debugging

A reported bug is a request to fix it: reproduce, find the root cause, fix it once where every
caller routes through, prove it, and stop. Do not stop at a diagnosis unless the user asked for
one.

## Workflow

1. **Capture the symptom exactly:** command or steps, input, environment, expected, actual, the
   shortest decisive error line.
2. **Reproduce** with the smallest deterministic case: a failing test first when possible.
3. **Gather evidence before theories:** logs, stack trace, the failing test, the recent diff and
   history of the touched files, related issues, traces, database state (read-only).
4. **Isolate the boundary:** caller, input data, state, network, database, cache, time, auth and
   permissions, environment, build, browser.
5. **One hypothesis at a time,** tested with the smallest probe; write down what each probe proved.
6. **Find the root cause.** Search every caller of the function you are about to change; the bug
   is usually in the shared code, not the one caller in the ticket.
7. **Fix once, at the root** (see `lean` section 9): no special cases, no flags, no
   workaround-on-workaround; delete workarounds the bug caused.
8. **Prove it:** the failing test passes; the original reproduction passes; impacted tests and
   `bun run check` pass.
9. **Report:** symptom, root cause with evidence, fix, regression test, checks run, remaining
   risk.

## By symptom

| Symptom                         | Look at                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| Works locally, fails deployed   | Environment differences, runtime (Workers vs Node vs Bun), build output, missing bindings or variables (name the variable, never read env files), region, caching |
| Flaky test                      | Time, randomness, test order, shared state, network, unawaited promises; replace sleeps with condition-based waits |
| Intermittent production error   | Concurrency and races, retries, timeouts, connection pool limits, partial failures, eventual consistency |
| Wrong data shown                | Cache keys and invalidation, tenant scoping, stale query data, timezone conversions, null vs undefined conversions |
| Slow                            | Measure first: query plans (`EXPLAIN ANALYZE`), N+1 queries, bundle size, waterfalls of requests, missing indexes |
| Type error at runtime           | Data crossing a boundary without a parse; `as` casts; outdated generated types              |
| Hydration mismatch              | Non-deterministic render (dates, random, `window` checks), locale and timezone differences  |

## Rules

- Never weaken an assertion, delete a test, swallow an error, silence a log or disable a safety
  control (auth, validation, row-level security, rate limits) to make a symptom disappear.
- Change one variable at a time.
- Check recent changes and high-churn files before blaming stable code.
- Preserve evidence for incidents; prefer rolling back to a known-good release over a hot fix
  under pressure, and say so.
- Security incidents follow the incident process in the `compliance` skill (notification clocks,
  no public status page entry).
- If it cannot be reproduced: report confidence, the probes tried, remaining theories and the next
  signal that would decide between them.
