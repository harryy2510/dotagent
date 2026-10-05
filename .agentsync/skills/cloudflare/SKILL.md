---
name: cloudflare
description: "Use when writing or reviewing Cloudflare Workers code or wrangler.jsonc: bindings (KV, R2, D1, Durable Objects, Queues, Workflows, Hyperdrive, AI, Vectorize), request handling and streaming, waitUntil, per-request state, secrets, observability, security patterns, generated Env types, and the Wrangler commands the user runs. Agents write code and config and print commands; they never run wrangler against an account."
---

# Cloudflare Workers

**Retrieve before you write.** Workers APIs, config fields and limits change often; read the
current docs (`https://developers.cloudflare.com/workers/`), the installed `wrangler` types and
`node_modules/wrangler/config-schema.json` before relying on memory.

## Hard rules

- **Agents never run `wrangler` or Cloudflare API commands that touch an account:** no deploy,
  secret, KV/R2/D1/Queues/Hyperdrive create, `d1 execute`, `tail`, `whoami`. Write the code and
  `wrangler.jsonc`, then print the exact command for the user.
- **Never hand-write `Env`.** Types come from `wrangler types` (the user runs it, or the repo's
  build does) into `worker-configuration.d.ts`; never edit that file.
- **Secrets** live in Wrangler secrets or the CI secret store; never in `wrangler.jsonc` `vars`,
  source or logs. Local secrets are the user's `.dev.vars` (agents never read or write it).
- **No request state in module scope.** Module-level variables are shared across requests in an
  isolate; per-request data goes through handler arguments or context.
- **Every promise is awaited, returned, or passed to `ctx.waitUntil()`.**

## Configuration

```jsonc
// wrangler.jsonc
{
	"$schema": "./node_modules/wrangler/config-schema.json",
	"name": "my-worker",
	"main": "src/index.ts",
	"compatibility_date": "<today when created; updated deliberately>",
	"compatibility_flags": ["nodejs_compat"],
	"observability": { "enabled": true, "head_sampling_rate": 1 },
	"assets": { "directory": "./dist/client", "binding": "ASSETS" }
}
```

- JSONC config (newer features are JSON-only); `$schema` for editor validation.
- `nodejs_compat` on; check a library actually runs on Workers before adopting it.
- Workers with static assets for new sites and apps; Pages only where the repo already uses it.
- Environments (`env.staging`) redeclare every binding they need; bindings are not inherited.

## Bindings over HTTP

| Need                         | Use                                              |
| ---------------------------- | ------------------------------------------------ |
| Key-value, low-write config  | KV                                               |
| Files and objects            | R2 (private buckets; signed URLs for access)     |
| SQL at the edge              | D1                                               |
| External Postgres or MySQL   | Hyperdrive (always), with TLS verification of the origin certificate |
| Coordination, per-entity state, websockets | Durable Objects                    |
| Background work              | Queues; multi-step durable work: Workflows       |
| Worker to Worker             | Service bindings, never public HTTP              |
| AI and vectors               | Workers AI, Vectorize (with `remote: true` in local dev) |

Use in-process bindings, never the Cloudflare REST API from inside a Worker.

## Requests and responses

- Stream large or unknown-size bodies; never `await response.text()` on unbounded data (128 MB
  memory limit).
- `ctx.waitUntil()` for work after the response (logging, cache writes); never destructure `ctx`
  (loses `this`).
- Set timeouts on outbound fetches; validate URLs against allowlists (SSRF) before fetching.
- Return structured error responses (the repo's one error shape); never `passThroughOnException`.

## Security

- `crypto.randomUUID()` / `crypto.getRandomValues()`; never `Math.random()` for anything secret.
- Compare secrets and signatures with `crypto.subtle.timingSafeEqual`.
- WAF and rate limiting rules complement, never replace, authorization in code.
- Do not log request bodies, headers with credentials, or personal data (see `compliance`).

## Platform classes

- `extends DurableObject`, `extends WorkerEntrypoint`, `extends WorkflowEntrypoint`; never
  `implements`.
- Inside them use `this.env` and `this.ctx`.
- Durable Object storage writes are transactional per object; keep objects small and focused.

## Observability

- `observability.enabled` with a sampling rate; structured JSON logs with request IDs; no
  sensitive data in logs or span attributes.

## Commands the user runs

Print these; do not run them. Full list in `references/wrangler-cli.md`.

| Task                    | Command                                   |
| ----------------------- | ----------------------------------------- |
| Generate Env types      | `bunx wrangler types`                     |
| Local dev               | `bunx wrangler dev` (or `vp dev` with the Cloudflare Vite plugin) |
| Dry-run deploy (build)  | `bunx wrangler deploy --dry-run`          |
| Deploy                  | CI, or `bunx wrangler deploy`             |
| Set a secret            | `bunx wrangler secret put NAME`           |
| Create a resource       | `bunx wrangler kv namespace create NAME` (and similar) |
| Tail logs               | `bunx wrangler tail`                      |

## Review workflow

1. Read the current docs and the generated types for the bindings in use.
2. Read whole files, not only the diff (binding access and handler context matter).
3. Types: handler signatures, no `any` on `Env` or params, no unsafe casts.
4. Config: compatibility date and flags, observability, secrets not in `vars`, bindings per
   environment.
5. Patterns: streaming, floating promises, module-level state, outbound URL validation.
6. Security: crypto, timing-safe comparisons, secret handling, logs.
7. Validate with `vp check` (type-aware lint catches floating promises).

## References

- `references/rules.md`: every best-practice rule with code and anti-patterns.
- `references/review.md`: type, config and binding-access review details.
- `references/wrangler-cli.md`: the full Wrangler CLI (for printing commands to the user).
