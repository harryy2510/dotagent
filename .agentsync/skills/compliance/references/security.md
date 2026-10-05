# Security standards

Researched **2026-10-05**. This file says what each standard requires and how a change is
checked against it, and ends with the everyday hardening checklist. For deep vulnerability
hunting and full audits, load the `security-audit` skill (attack classes, reconnaissance,
validation); this file does not repeat it.

## OWASP Top 10:2025 (web applications; final January 2026)

| ID  | Risk                                   | Check in every change                                                                                          |
| --- | -------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| A01 | Broken Access Control (includes SSRF)  | Authorization at the last trusted boundary, deny by default, tenant scope in the query; outbound requests only to approved hosts, after resolving addresses, no redirects to private ranges |
| A02 | Security Misconfiguration              | Secure defaults, no debug in production, security headers, least-privilege cloud roles, no default credentials, config reviewed and scanned |
| A03 | Software Supply Chain Failures         | Pinned dependencies with a lockfile, vulnerability and malware scanning, provenance for releases, no install scripts from unknown packages, SBOM |
| A04 | Cryptographic Failures                 | TLS everywhere, strong algorithms (AES-GCM, SHA-256+, Argon2/bcrypt via the auth library), no custom crypto, keys in a key service |
| A05 | Injection                              | Parameterized queries (ORM), output encoding, no `eval`, no shell with user input, schema-validated input       |
| A06 | Insecure Design                        | Threat model for new flows; limits, abuse cases and failure modes designed before code                         |
| A07 | Authentication Failures                | MFA and passkeys, rate-limited sign-in, no user enumeration, session rotation and expiry, secure reset flows    |
| A08 | Software or Data Integrity Failures    | Signed webhooks verified, signed releases, no unsafe deserialization, integrity of audit records               |
| A09 | Security Logging and Alerting Failures | Security events audited and alerted on, without sensitive content; logs retained; alerts reach a person       |
| A10 | Mishandling of Exceptional Conditions  | Fail closed, no stack traces or internals in responses, errors handled at boundaries, no partial writes on failure |

## OWASP API Security Top 10 (2023)

Broken object level authorization; broken authentication; broken object property level
authorization (mass assignment, over-exposure); unrestricted resource consumption (limits,
pagination, timeouts, cost); broken function level authorization; unrestricted access to
sensitive business flows (abuse, scraping); SSRF; security misconfiguration; improper inventory
management (old versions, undocumented endpoints); unsafe consumption of third-party APIs.

Checks: every endpoint has an owner check per object; response schemas expose only listed
fields; input schemas reject unknown keys for writes; every list is paginated; every external
call has a timeout and size limit; the route list matches the docs.

## OWASP Top 10 for LLM and Generative AI Applications (2025)

Prompt injection; sensitive information disclosure; supply chain; data and model poisoning;
improper output handling; excessive agency; system prompt leakage; vector and embedding
weaknesses; misinformation; unbounded consumption.

Checks for agent and tool platforms: tool descriptions, tool outputs and model outputs are
untrusted input; permissions never widen from model output; destructive actions need explicit
grants; secrets never enter model context; per-tenant isolation of retrieved data; output
encoded before rendering or execution; budgets on tokens, calls and cost.

## OWASP ASVS 5.0 (May 2025)

The verification standard behind the lists above, in three levels:

- **Level 1:** baseline for every application.
- **Level 2:** applications handling sensitive or business data (target for B2B SaaS).
- **Level 3:** high-value or high-assurance systems (health, finance, critical infrastructure).

Use ASVS chapters as the checklist for a security review of a new area (authentication,
session, authorization, validation, cryptography, error handling, data protection,
communication, configuration, API, files, business logic).

## Other references to know

- **CWE Top 25** (MITRE): the most dangerous weakness types; use CWE IDs in findings.
- **NIST SSDF (SP 800-218)** and **NIST CSF 2.0**: secure development practices and an
  organization-level framework; common in US enterprise and government questionnaires.
- **CIS Controls v8.1** and **CIS Benchmarks**: hardening baselines for cloud accounts and hosts.
- **SLSA** and **SBOM** (SPDX, CycloneDX): build provenance and component inventory; increasingly
  requested by enterprise and US federal buyers.
- **OWASP MASVS** for mobile apps.

## Practices every product needs

- **Threat modelling** (STRIDE or similar) for new trust boundaries and flows; recorded with the
  design.
- **Security headers:** HSTS, Content-Security-Policy, X-Content-Type-Options, Referrer-Policy,
  frame-ancestors; cookies `Secure`, `HttpOnly`, `SameSite`.
- **Rate limiting and abuse controls** on sign-in, sign-up, password reset, invitations, exports
  and any expensive endpoint.
- **Vulnerability disclosure:** `/.well-known/security.txt` (RFC 9116) with a contact and policy;
  acknowledge reports within a stated time; no legal threats against good-faith researchers.
- **Penetration testing:** at least yearly and before major launches, by an independent tester;
  findings tracked to closure; customers ask for the summary letter.
- **Dependency and secret scanning in CI;** container and infrastructure scanning where used.
- **Least privilege** for people and services; production access logged and reviewed quarterly.
- **Backups and restore tests;** incident response exercised yearly.

## Everyday hardening checklist

Merged from the former `security-and-hardening` skill. Use for any change touching auth, input,
secrets, permissions, uploads, webhooks, integrations or AI features.

**Never, to make a feature work:** disable row-level security, authorization checks,
validation, CSRF or CORS protection, or rate limits.

**Auth and authorization**

- Identity comes from trusted session or token state on the server.
- Authorization checks resource ownership, tenant, role and action; admin paths enforce roles on
  the server.
- Client-sent user, role, tenant, price or permission fields are ignored or re-validated.
- Cookie and session settings match the framework and deployment target.

**Input and output**

- The server validates input with the repo's schema at the boundary (once; see `lean`).
- Allowlists, never denylists, for redirects, origins (CORS), file types and sizes, webhook
  event types and outbound hosts.
- Untrusted HTML or Markdown is sanitized or escaped before rendering.
- Errors returned to clients are stable codes and messages: no stack traces, SQL, provider
  payloads or internal names.

**Uploads**

- Check size before reading the body; check type by content, not extension; store outside the
  web root or in private object storage scoped by tenant; serve through signed, short-lived URLs;
  never execute or render uploaded HTML/SVG on the app origin.

**Webhooks (incoming)**

- Verify the signature over the raw body with a timing-safe comparison; reject stale timestamps
  (replay window of a few minutes) and duplicate event IDs; accept only known event types;
  answer fast and process asynchronously.

**Webhooks (outgoing)**

- Sign every delivery; support secret rotation with an overlap (sign with both secrets);
  deliver only to HTTPS URLs that pass the outbound host rules (no private ranges after DNS
  resolution); retry with backoff and give up visibly.

**Data and secrets**

- Queries scoped by tenant and user where required; row-level security or server guards cover
  read and write paths.
- Secrets stay server-side; changes to secrets are described for the user, never written into
  environment files by the agent.

**LLM and agent systems (detail for the LLM Top 10)**

- Untrusted prompts, documents, URLs and retrieved content cannot override system instructions
  or tool constraints.
- Model output is validated before it reaches HTML, SQL, shell, URLs, files, email, workflows or
  APIs.
- Tools, plugins, MCP servers and connectors have least-privilege scopes; destructive,
  financial, external or data-disclosing actions need explicit authorization bound to the
  actor, tenant, action, arguments and target.
- Prompts, logs, training data, retrieval corpora and vector stores exclude secrets,
  unnecessary personal data and other tenants' data; retrieval filters by tenant before search;
  sources are tracked so poisoned content can be removed.
- Models, providers, datasets and packages are inventoried and pinned.
- Rate limits, token and output caps, cost budgets, timeouts and loop guards cover model calls,
  retries and recursive tool use.

**Before release**

- Focused tests cover unauthorized, forbidden, invalid input and cross-tenant attempts.
- Dependency and platform warnings relevant to the change were checked.
- Rollback does not require exposing or rotating secrets unless stated.

## Mapping for findings

Tag security findings with the OWASP ID and CWE where possible, for example
`authz: A01 / CWE-639 ...`, so they feed SOC 2, ISO 27001 and questionnaire answers directly.
