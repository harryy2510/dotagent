# Environment variables

Every variable costs: a schema entry, docs, a value in every deploy config (CI, infrastructure
code, Docker Compose), an explanation for whoever deploys, and a broken deploy when one is
missing. Agents add them for everything. Stop.

## A variable may exist only if it passes one test

1. **Secret:** keys, passwords, tokens, signed URLs.
2. **Differs per deployment and cannot be derived from a variable that already exists:**
   database URL, public base URLs, cloud region.
3. **The operator must choose it:** for example a self-hosted install's SMTP server.

Everything else is a constant in code: timeouts, retries, limits, page sizes, retention days,
feature on or off, internal paths, defaults that are the same everywhere.

## Derive instead of adding

- One deploy-target variable already says cloud or self-hosted: no `IS_CLOUD`,
  `ENABLE_X_ON_CLOUD`, `USE_KMS`.
- One base URL gives every path under it: no separate `*_CALLBACK_URL`, `*_WEBHOOK_URL`.
- `NODE_ENV` gives development or production: no `DEBUG`, `IS_DEV`.
- The server can tell the client what it needs through the API instead of a public build-time
  copy of a server variable.

## Smells

- `*_ENABLED` for something always on.
- `*_TIMEOUT`, `*_RETRIES`, `*_LIMIT`, `*_TTL` with a default nobody overrides.
- A variable read only in one test.
- Two variables that always change together.
- A variable with a default that is never actually set: it is a constant.
- Reading `process.env` or `import.meta.env` outside the one env package.

## When adding one

State in the task notes which test it passes, add it to the env package with a Zod schema and
a clear error, and list the value the user must set in each deploy config. Optional variables
mean "feature off when unset", never "silently different behaviour".

## lean env (audit)

List every variable in the env package with:

`<NAME> · <test 1/2/3 or none> · set in: <deploy configs that set it> · <keep | constant | derive from X | delete>`

End with `<N> variables, <M> can become constants or be removed.` Report only.
