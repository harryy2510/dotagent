# Engineering controls

How the rules become code and infrastructure. Each control: what it is, the pattern, the
evidence that proves it.

## Data classification

- Classify every schema field, tool input and output, log field and event as `standard`, `pii`
  or `phi`, in the schema itself (one source), so handling follows the class automatically.
- Unknown class is treated as the most sensitive.
- Classification drives: what may be logged, kept, exported, sent to vendors or models, and the
  retention rule.

Evidence: a test that fails when a field or tool has no class, or when a class is wrong for
known personal data (names, emails, messages, files, contacts).

## Authorization and tenant isolation

- One authorization function per resource type, called at the last trusted boundary (route
  handler or service entry), deny by default, from server-side identity.
- Tenant scope enforced in the query itself (and with database row-level security where the
  repo uses it), not by filtering after the fetch.
- Same rules for background jobs, retries, exports, webhooks and cached results; re-check
  authorization when delayed work performs an effect.

Evidence: tests per route for each role, signed-out, and a member of another tenant using this
tenant's IDs; all refused, nothing leaked.

## Authentication

- MFA available for everyone; enforceable per organization; phishing-resistant options
  (passkeys); SSO for business plans.
- Re-authentication before sensitive actions (export, delete, key creation, security settings).
- Session expiry, revocation on password change, device list, sign-out everywhere.

Evidence: tests for step-up enforcement and revocation.

## Encryption and secrets

- TLS 1.2+ everywhere (1.3 preferred); HSTS on web.
- Encryption at rest by the platform; envelope encryption with a managed key service for
  credentials and other secrets, scope bound into the authenticated data.
- Secrets only in the secret store and the one env package; never in code, logs, URLs or
  responses; rotation supported with overlap.

Evidence: configuration and tests; key rotation tested; secret scanning in CI.

## Logging, telemetry and audit

- Diagnostics (logs, traces, metrics) carry no personal or health data: allowlisted fields
  only, errors described by code, not by message content.
- Audit records are separate from diagnostics: actor, tenant, action, target, time, outcome;
  no sensitive content; append-only; tamper-evident (hash chain) and archived write-once for
  the retention period.
- Staff access to customer data is itself audited.

Evidence: a log-safety test that fails when a log line contains personal data; an integrity
check of the audit chain.

## Retention, deletion and erasure

- A retention schedule per data category (the one source), enforced by scheduled deletion jobs.
- Erasure of a person removes their data from every store except records the law requires;
  those are pseudonymized (the link from ID to person is removed).
- Organization deletion tears down everything, in a checked order, with a final sweep.
- Backups expire within a bounded period; restores must not resurrect deleted data (re-apply
  deletions after restore).
- Deleting a row is not crypto-shredding; only claim crypto-shredding with per-subject keys and
  proven destruction across backups.

Evidence: tests per category that the job deletes on time; erasure tests that check every store.

## Rights handling

- Self-service where possible: profile edit, export (machine-readable), delete account.
- A documented process for the rest, with identity verification, a log of requests and
  deadlines (one month GDPR, 45 days US states).
- As a processor: tools that let customers erase and export their end users' data.

## Consent and notice

- Consent records: who, what, version, time, how withdrawn.
- Legal document versions stored; acceptance recorded per user with version and time; material
  changes notified ahead and re-accepted.
- Cookies: only strictly necessary ones without consent; consent banner when anything else is
  added.

## Vendors and data flows

- Every external service that receives personal data: purpose, data, region, agreement (DPA,
  BAA where needed), approval date, in the processor register.
- Egress controls: approved hosts only for sensitive data; no personal data in third-party
  analytics, error trackers or AI models unless approved and disclosed.

## Incident response

- Detection: monitoring and alerting on availability and security signals.
- A plan: severity, roles, containment, evidence preservation, notification clocks (72 hours
  GDPR authority, processor to controller without undue delay, HIPAA up to 60 days, contract
  terms), post-incident review.
- Security incidents and breaches go to affected customers directly, never on a public status
  page.

## Change management and secure development

- Reviewed changes, CI checks that must pass, pinned dependencies with a lockfile, dependency
  vulnerability scanning, secret scanning, migrations reviewed, production access restricted
  and logged.

## Availability

- Backups with tested restores; recovery objectives (RTO, RPO) that support any SLA; monitoring
  from outside the infrastructure; status communication.

## AI features

- Customer data not used for training or evaluation unless agreed and disclosed.
- Model providers are vendors (register, DPA, region, retention, zero-retention options).
- Tool outputs and model outputs are untrusted input; they cannot widen permissions.
- Transparency where required (Article 50): users know when they deal with AI or AI content.

## Accessibility

- WCAG 2.2 AA: keyboard access, visible focus, contrast, labels, reduced motion, screen reader
  names; automated scans (axe) on every page plus manual checks of key flows.
