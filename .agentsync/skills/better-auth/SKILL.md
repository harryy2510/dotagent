---
name: better-auth
description: "Use when building authentication and organizations with Better Auth: server and client setup, database adapters, sessions and cookies, email and password with verification and reset, social sign-in, passkeys, two-factor with recovery codes, organizations, members, roles and invitations, SSO (SAML/OIDC) and SCIM directory sync plugins, re-authentication before sensitive actions, hooks, rate limits, and audit."
---

# Better Auth

Check the installed version (`better-auth` and its plugin packages) and read its types and docs
before using an option; the plugin APIs move quickly.

## Hard rules

- **One auth instance per runtime,** created from the repo's env module; secrets
  (`BETTER_AUTH_SECRET`, OAuth client secrets) from the secret store, never in code.
- **Use the library's flows,** never custom session tables, token generation or password hashing.
- **Auth tables belong to Better Auth.** Generate their schema with the Better Auth CLI or the
  documented schema for the adapter; never hand-edit generated auth schema files; app tables
  reference auth tables by ID.
- **Authentication is not authorization.** A session says who; every route still checks the
  member's role in the organization that owns the resource.
- **Sensitive actions require recent authentication** (step-up): changing email, password, two-factor,
  passkeys, SSO, creating or rotating keys, exporting or deleting data.
- **Audit** sign-ins, failed sign-ins, method changes, role changes, invitations, SSO and SCIM
  changes, with actor, organization, time and outcome, no secrets.

## Server

```ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { organization, twoFactor } from 'better-auth/plugins'
import { passkey } from '@better-auth/passkey'

export const auth = betterAuth({
	database: drizzleAdapter(db, { provider: 'pg' }),
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	emailAndPassword: { enabled: true, requireEmailVerification: true, minPasswordLength: 12 },
	socialProviders: { google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET } },
	session: { expiresIn: 60 * 60 * 24 * 7, cookieCache: { enabled: true, maxAge: 300 } },
	rateLimit: { enabled: true },
	plugins: [organization(), twoFactor(), passkey()]
})
```

- Verify import paths against the installed version (some plugins ship as separate
  `@better-auth/*` packages).
- Mount the handler on the API router (`/api/auth/*`); the web app talks to it through the client.
- Cookies: `Secure`, `HttpOnly`, `SameSite=Lax`; cross-subdomain cookies only when the dashboard
  and API need them, with `trustedOrigins` listing exact origins.
- One database for auth per deployment target; adapters must support the transactions the plugins
  need (SCIM and organization plugins write several rows at once).

## Client

```ts
import { createAuthClient } from 'better-auth/react'
import { organizationClient, twoFactorClient } from 'better-auth/client/plugins'
import { passkeyClient } from '@better-auth/passkey/client'

export const authClient = createAuthClient({
	baseURL: clientEnv.VITE_API_URL,
	plugins: [organizationClient(), twoFactorClient(), passkeyClient()]
})
```

- Session reads in the app go through TanStack Query (prime it in the root `beforeLoad`); one
  bootstrap request for the signed-in shell.
- Never store tokens in `localStorage`; the session cookie is the credential.

## Flows

| Flow                     | Notes                                                                                  |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Sign up                  | Terms acceptance recorded with version and time; email verification before access     |
| Sign in                  | Generic error for wrong email or password (no account enumeration); rate limited      |
| Password reset           | Single-use, short-lived link; all sessions ended after a reset                         |
| Two-factor (TOTP)        | Recovery codes shown once, stored hashed; "trust this device" bounded (for example 30 days) |
| Passkeys                 | Offered after sign-in; can replace passwords; named per device; removable              |
| Social sign-in           | Link accounts only when the provider's email is verified                               |
| Sessions and devices     | List with device and approximate location; revoke one or all others                    |
| Re-authentication        | A fresh password, passkey or code within a short window before sensitive actions       |

## Organizations

- Roles: owner, admin, member (extend with access control statements when needed); the last owner
  cannot leave or be demoted.
- Invitations: expiring, single-use, bound to the invited email; resend and revoke.
- Active organization stored on the session; every API call checks membership in the
  organization of the resource, not only the active one.
- Organization-level security settings (require two-factor, allowed sign-in methods, idle timeout)
  are enforced in a session guard on every request, not only in the UI.

## SSO and SCIM

- SAML/OIDC through the SSO plugin; verify domain ownership (DNS TXT) before enabling; test
  sign-in before turning it on; owners keep a fallback method.
- SCIM directory sync through the SCIM plugin: tokens shown once and stored hashed, rotation
  revokes the old token, group-to-role mapping never grants or removes owners, deprovisioning
  ends sessions.

## Hooks

- Use `databaseHooks` and plugin hooks for side effects (audit, emails), but never query or write
  the app database inside the auth write's transaction on single-connection pools; run app work
  after commit.

## Testing

- Integration tests through the real handler (`auth.handler(request)`): sign up, verify, sign in,
  wrong password, two-factor, passkey with Playwright's virtual authenticator in browser tests,
  invitation acceptance, role checks, step-up required, sessions revoked.
- Never stub the session to bypass auth in route tests; create real test users.
