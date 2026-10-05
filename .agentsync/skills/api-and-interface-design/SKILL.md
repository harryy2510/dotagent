---
name: api-and-interface-design
description: "Use when designing or changing a boundary others depend on: HTTP APIs, server functions, SDK methods, webhooks and events, module exports, component props, database-backed contracts. Covers contract-first design, one error shape, pagination, idempotency, versioning and deprecation, naming, nullability, and contract tests."
---

# API and interface design

Boundaries should be boring, consistent and hard to misuse. A boundary is a promise: once
callers depend on it, every change is a migration.

## Workflow

1. **Name the consumers:** UI, another module, public API users, SDK users, webhook receivers,
   workers, third parties.
2. **Write the contract before the code:** input schema, output schema, error codes, auth and
   tenant scope, idempotency, ordering, pagination, side effects, limits.
3. **Derive types from the schema** (Zod, Drizzle, OpenAPI generation); never hand-write a parallel
   type (`lean`).
4. **Copy the repo's existing conventions exactly** (URL style, casing, error shape, pagination);
   a second convention is a bug.
5. **Validate once at the boundary**, trust types inside.
6. **Write contract tests:** success, invalid input, unauthenticated, forbidden, another tenant,
   not found, conflict.

## Conventions (defaults for new APIs; existing repos keep theirs)

- **Resources:** plural nouns, IDs in the path (`/projects/{projectId}/keys`); prefixed opaque IDs
  (`prj_01j9...`) so a wrong ID type fails fast.
- **Methods:** `GET` reads (safe, cacheable), `POST` creates or performs actions, `PATCH` partial
  update (missing key = unchanged), `PUT` full replace, `DELETE` removes.
- **Casing:** one casing for JSON fields across the whole API (camelCase for TypeScript stacks).
- **Timestamps:** ISO 8601 UTC strings on the wire; `Date` inside.
- **Money:** integer minor units plus currency code.
- **Enums:** lowercase strings, documented; adding a value is a compatible change only if clients
  are told to handle unknown values.
- **Nullability:** `null` means "no value"; a missing key means "not sent" (only in inputs). Never
  both for the same field in outputs.

## Errors: one shape

```json
{ "error": { "code": "PROJECT_NOT_FOUND", "message": "This project does not exist.", "issues": [] } }
```

- `code`: stable, machine-readable, SCREAMING_SNAKE; clients branch on it.
- `message`: safe for end users; no stack traces, SQL, provider payloads or internal names.
- `issues`: field-level validation problems (`path`, `message`).
- HTTP status matches: 400 invalid, 401 not signed in, 403 signed in but not allowed (or 404 to hide
  existence of other tenants' resources), 404, 409 conflict, 422 semantic validation if the repo
  uses it, 429 rate limited (with `Retry-After`), 5xx only for server faults.
- Distinguish your own failures from upstream failures (for example `UPSTREAM_UNREACHABLE` vs
  `INTERNAL_ERROR`) when callers act differently on them.

## Lists

- Cursor pagination for anything that can grow: `?cursor=...&limit=...` returning
  `{ data, nextCursor }`; a maximum `limit`.
- Stable sort order, documented; filters as query params validated by the schema.
- Never return unbounded arrays.

## Writes and side effects

- **Idempotency:** creates and actions that can be retried accept an `Idempotency-Key` header; the
  same key returns the first result.
- Server-generated fields (IDs, timestamps, owner, tenant) are never accepted from clients.
- Mass assignment: input schemas list allowed fields; unknown keys are rejected or stripped, never
  written.
- Long work returns `202` with a resource to poll, or a webhook; never a request held open for
  minutes.

## Auth and tenancy

- Every endpoint states who may call it; authorization at the boundary, tenant from the
  server-side session or key, never from the body.
- Return 404 (not 403) for other tenants' resources so existence does not leak.

## Webhooks and events

- Versioned event types (`trigger.fired`), a stable envelope (`id`, `type`, `createdAt`, `data`),
  signatures (Standard Webhooks), retries with backoff, at-least-once delivery; receivers dedupe
  by `id`.

## Change and versioning

- Compatible changes: adding optional input fields, adding output fields, adding endpoints, adding
  enum values clients were told to tolerate.
- Breaking changes: removing or renaming fields, changing types, nullability, ordering, error codes
  or defaults. They need a version (path `/v2` or a dated version header) or a deprecation window
  announced to users, never a silent change.
- Do not add `v2` endpoints or parallel functions when the existing one can be extended
  compatibly.

## SDKs, modules and components

- Public exports are deliberate: package `exports` subpaths per module, no barrel re-exporting
  everything.
- Function signatures take real domain input; never dependency bags or test-only parameters.
- Component props: required props for what the component cannot work without; no boolean props
  that turn it into a different component; callbacks named `onX`.

## Documentation

- The schema generates the reference (OpenAPI from Zod or the framework); examples are tested.
- Document limits, errors, pagination and idempotency per endpoint.
