---
name: supabase-auth-data
description: "Use in projects built on Supabase: choosing the server, browser or admin client, cookie sessions with @supabase/ssr, auth flows and route guards, row-level security as the authorization layer, generated database types, migrations, Edge Functions and @supabase/server, Supabase environment variable names, and the commands the user (not the agent) runs."
---

# Supabase: auth, data and types

For Postgres design, indexes, RLS performance and locking, also load `postgres`. For non-Supabase
Postgres with Drizzle, use `drizzle` instead of this skill.

## Clients

| Client                    | Where                        | RLS | Use for                                                       |
| ------------------------- | ---------------------------- | --- | ------------------------------------------------------------- |
| Server client (`@supabase/ssr`, cookies) | Server functions, API routes | Yes | All reads and writes on behalf of the signed-in user |
| Browser client (singleton) | Client                      | Yes | `onAuthStateChange` and session refresh only                  |
| Admin client (secret key) | Server only                  | No  | Cross-user or system work, each use authorized and audited    |

- Data never flows through the browser client: components use TanStack Query over server
  functions.
- The admin client bypasses RLS: every call states why, checks authorization in code first, and
  writes an audit record for sensitive actions. Never import it from a module a client bundle can
  reach.

## Auth

- Supabase Auth (email/password, OAuth, passkeys if enabled). One `onAuthStateChange` listener in
  the root shell keeps the query cache in sync on `SIGNED_IN`, `TOKEN_REFRESHED`, `SIGNED_OUT`.
- Route guards in `beforeLoad` (`_auth` guest-only, `_authed` signed-in) are UX; RLS and server
  checks are the security.
- Use `getUser()` (verified with the auth server) for authorization decisions on the server, not
  `getSession()` from cookies alone.

## Row-level security

- RLS on for every table in exposed schemas; policies per operation (`select`, `insert`, `update`,
  `delete`) with `to authenticated` and explicit `using`/`with check`.
- Tenant scope through a membership check (`exists (select 1 from members where ...)`), wrapped
  for performance (`(select auth.uid())`); see `postgres` RLS references.
- Never disable RLS or use the admin client to "make it work".
- Test policies with negative cases (another user, another tenant, anonymous).

## Types and migrations

- Generated database types (`database.types.ts`) are the single source of truth; never edit them
  and never hand-write table, view or RPC types.
- Prefer deriving app types from the generated ones (`Tables<'projects'>`,
  `TablesInsert<'projects'>`). `.overrideTypes<T>()` only for JSON columns or views the generator
  cannot type, with `T` derived from a Zod schema, never a free-hand shape.
- Migrations in `supabase/migrations/` are immutable once created: every change is a new file
  sorted after the latest.
- **Agents never run Supabase CLI or database commands** (`db push`, `migration up`, `gen types`
  against a project, `psql`, `db execute`). Write the migration file, then print the exact
  command for the user (usually an existing package script such as `bun run db:push` and
  `bun run types:db`).

## Environment variables

- Names only; agents never read, print or edit `.env*` files or values.

| Variable                        | Where              | Notes                                  |
| ------------------------------- | ------------------ | -------------------------------------- |
| `VITE_SUPABASE_URL`             | Client (public)    | Project URL                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Client (public)    | Publishable key (RLS still applies)    |
| `SUPABASE_SECRET_KEY`           | Server secret      | Admin client only; Worker binding or secret store |

- `VITE_` values ship to every browser: never a secret.
- Server secrets come from the runtime's secret store (Worker bindings), read through the repo's
  one env module.

## Edge Functions and `@supabase/server`

- `@supabase/server` (public beta in 2026; check its docs before large migrations) for stateless
  handlers in Edge Functions, Workers, Hono and Bun: `withSupabase({ auth: 'user' }, handler)` or
  `createSupabaseContext(req, options)`.
- `ctx.supabase` is RLS-scoped; `ctx.supabaseAdmin` is privileged (same rules as the admin client).
- It does not replace `@supabase/ssr` for cookie sessions in frameworks.
- Hono: the adapter at `@supabase/server/adapters/hono`.
- Shared code in `supabase/functions/_shared/`, imported by relative path.
- Calling an Edge Function from the app: `supabase.functions.invoke()` (except streaming).
- After moving functions to `@supabase/server`, delete the old shared auth, CORS and client
  helpers so there is one path.
