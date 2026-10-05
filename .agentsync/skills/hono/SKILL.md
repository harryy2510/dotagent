---
name: hono
description: "Use when building or changing a Hono API that runs on Bun, Node or Cloudflare Workers: app and router structure, typed context and per-request variables, validating input once with Zod at the edge, the one error shape, middleware order (request ID, auth, tenant, rate limit, logging), authorization per route, responses and pagination, OpenAPI from schemas, typed RPC clients, testing with app.request, and runtime differences."
---

# Hono APIs

Hono runs the same app on Bun, Node and Workers. Keep handlers thin, contracts in schemas, and
behaviour in services. API conventions (resources, errors, pagination, idempotency) come from
`api-and-interface-design`.

## Structure

```text
src/
  app.ts            create the app, mount middleware and routers
  http.ts           readJson, readQuery, fail: the edge helpers (one owner)
  middleware/       request-id, session, rate-limit, request-log
  routes/           one router per resource
  services/         business logic, no Hono imports
```

```ts
// src/app.ts
import { Hono } from 'hono'
import { requestId } from 'hono/request-id'
import { projectsRouter } from './routes/projects'

export type AppEnv = { Variables: { session: Session; requestId: string } }

export const app = new Hono<AppEnv>()
	.use(requestId())
	.use('/api/*', sessionMiddleware)
	.route('/api/projects', projectsRouter)
	.onError(handleError)
	.notFound((c) => fail(c, 404, 'NOT_FOUND', 'Not found.'))
```

- One `AppEnv` type for context variables and bindings; routers use it, never `any`.
- Per-request state lives in `c.var`, never in module scope (Workers isolates are shared).
- Chain `.route()` so the app's type includes every route (needed for the RPC client).

## Input: parse once at the edge

```ts
// src/http.ts
export async function readJson<T extends z.ZodType>(c: Context, schema: T): Promise<z.infer<T>> {
	const parsed = schema.safeParse(await c.req.json().catch(() => undefined))
	if (!parsed.success) fail(c, 400, 'VALIDATION_ERROR', 'Some fields are invalid.', parsed.error.issues)
	return parsed.data
}
```

- Every body, query and param goes through one schema at the edge (`readJson`, `readQuery`, or
  `@hono/zod-validator` if that is the repo's choice; one or the other, never both).
- After the parse, handlers and services trust the types: no re-checks (`lean` section 1).
- Route params with typed IDs validate their prefix (`prj_...`).

## Errors: one shape

```ts
export function fail(c: Context, status: ContentfulStatusCode, code: string, message: string, issues?: z.core.$ZodIssue[]): never {
	throw new HTTPException(status, {
		res: c.json({ error: { code, message, ...(issues && { issues }) } }, status)
	})
}
```

- `onError` turns unknown errors into `500 INTERNAL_ERROR` with a request ID, logs only safe
  details (no bodies, no personal data), and never returns stack traces.
- Database constraint violations map to `409 CONFLICT` at the boundary.

## Middleware order

1. Request ID.
2. Security headers and CORS (allowlisted origins only; credentials only for exact origins).
3. Session or API key resolution (sets `c.var.session`).
4. Tenant resolution from the session or key, never from the body.
5. Rate limiting per key, user and IP for sensitive routes.
6. Request logging and metering (no payloads unless the project allows it).

## Authorization per route

```ts
projectsRouter.post('/:projectId/keys', async (c) => {
	const { projectId } = readParams(c, projectParams)
	const project = await requireProjectRole(c.var.session, projectId, ['owner', 'admin'])
	const input = await readJson(c, createKeyInput)
	return c.json({ data: await keys.create(project, input) }, 201)
})
```

- Every route states who may call it, in code, next to the handler; default deny.
- Other tenants' resources answer 404.
- Step-up (recent re-authentication) for sensitive actions.

## Responses

- `{ data }` for success, `{ data, nextCursor }` for lists, `{ error }` for failures (the repo's
  shapes).
- Response bodies parsed or built from the response schema so nothing extra leaks.
- `c.body(stream)` for large responses; set `Cache-Control` deliberately.

## OpenAPI and clients

- Generate OpenAPI from the same Zod schemas (`@hono/zod-openapi` or the repo's generator) when
  the API is public; never write the spec by hand.
- Internal TypeScript clients: `hc<typeof app>` (Hono RPC) or the repo's ofetch client typed from
  the response schemas; never hand-written response types.

## Runtimes

- **Bun:** `export default { fetch: app.fetch, port }`; `Bun.serve` options when needed.
- **Workers:** `export default app` (or `{ fetch: app.fetch, scheduled, queue }`); bindings through
  `c.env` typed from generated Worker types; `c.executionCtx.waitUntil` for post-response work.
- **Node:** `@hono/node-server`.
- Runtime-specific code behind the repo's adapter seam, not `if (typeof Bun !== 'undefined')`
  checks scattered through handlers.

## Testing

```ts
import { describe, expect, it } from 'vite-plus/test'
import { app } from '../src/app'

describe('POST /api/projects/:projectId/keys', () => {
	it('refuses a member', async () => {
		const res = await app.request('/api/projects/prj_01j9.../keys', { method: 'POST', headers: memberHeaders, body: '{}' })
		expect(res.status).toBe(403)
	})
})
```

- `app.request()` exercises the real middleware and routes; no server to start.
- Cover invalid input, unauthenticated, forbidden, another tenant, not found, conflict and success
  for each route.
