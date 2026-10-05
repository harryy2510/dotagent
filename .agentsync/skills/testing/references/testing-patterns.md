# Testing patterns

Detail behind the `testing` skill.

## Test shape

- One behaviour per test, named by the outcome the caller or user sees.
- Arrange, act, assert, in that order, with a blank line between.
- Keep tests readable over clever: repeated setup is fine when it shows the behaviour; extract a
  helper when the same setup appears three times and means the same thing.
- Assert outputs, effects and calls at the outside boundary; never private state.

## Layers

| Layer       | Covers                                                                     | Runner        |
| ----------- | -------------------------------------------------------------------------- | ------------- |
| Unit        | Pure logic, parsers, mappers, query key factories, permission functions    | `vp test`     |
| Integration | Routes and server functions with a real (test) database or in-memory adapter, auth and tenant boundaries, provider adapters against fakes | `vp test` |
| Component   | Conditional rendering, forms, accessible states, interactions              | `vp test` + Testing Library |
| End to end  | Flows that cross pages, emails, OAuth, browsers, real storage              | Playwright    |

Push each behaviour to the lowest layer that can prove it.

## Regression tests

- Reproduce the bug first.
- Name the test after the user's symptom ("shows the old key as stopping after rotation").
- Assert the edge case that failed, not only the happy path.
- Keep it next to the code it protects.

## Fakes over mocks

- A fake implements the same contract with real behaviour (an in-memory store, a local HTTP server
  that answers like the provider). It catches more bugs than a mock and survives refactors.
- Mocks (`vi.fn`, `vi.mock`) are for the edges you cannot run: time, randomness, a third-party
  SDK call with no fake.
- Never mock the module under test or its siblings.

## Time and randomness

- `vi.useFakeTimers()` and `vi.setSystemTime()` for expiry, overlaps and retries; restore after.
- Seed or inject randomness only through the real API the code already has (an ID generator
  module mocked at its boundary), never a test-only parameter.

## Database tests

- Run migrations on a fresh test database (or schema) per run; never edit migrations for tests.
- Seed through the same insert types the app uses.
- Wrap each test in its own tenant so tests run in parallel without truncating tables.
- Test row-level security and tenant isolation with negative cases.

## Coverage

- Coverage is a hint, not a goal: `vp test --coverage` to find untested branches in risky code.
- Never write tests only to raise a number.
