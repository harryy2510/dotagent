---
name: compliance
description: 'Always-on compliance and privacy gate for every agent and every kind of work (code, schemas, config, infrastructure, vendors, docs, marketing, legal pages, design, backlog). Covers privacy law (GDPR, UK GDPR, Swiss FADP, ePrivacy and cookies, CCPA and 19 US states, Canada, Brazil LGPD, India DPDP, Japan, Australia, China PIPL), US breach and FTC rules, HIPAA and HITRUST, SOC 2, ISO 27001/27017/27018/42001, FedRAMP, CSA STAR, PCI DSS, the EU AI Act and California ADMT, NIS2 and DORA, security standards (OWASP Top 10:2025, API Security Top 10, LLM Top 10, ASVS 5.0, CWE, NIST SSDF and CSF, CIS, SLSA), accessibility (WCAG 2.2, EAA, ADA), e-signatures, marketing email, sanctions and export controls. Decides what applies, what each change must do, what evidence proves it, and what may honestly be claimed. Modes: "compliance check" (a diff), "compliance audit" (a repo), "compliance claims" (public and legal text), "compliance vendor" (a new service), "compliance records" (ROPA, retention, DPIA). Use for any change touching personal, health or payment data, auth, logging, storage, retention, deletion, vendors, AI features, legal pages, marketing claims, or when the user says "compliance", "GDPR", "HIPAA", "SOC 2", "privacy", "DPA", "is this compliant".'
---

# Compliance

> **Know what applies. Build the control. Keep the evidence. Claim only what is true.**

Always on, for every change. The `lean` skill still applies: compliance is never a reason for
bloat, and lean is never a reason to drop a control.

This skill is generic. A repository adds its specifics (frameworks in scope, data classes,
canonical docs, processor register) in its own instructions; read them first and follow the
most specific rule.

## The change gate

Before implementing, answer in the task notes (a change with no privacy or security effect
records that conclusion and why):

1. **Data:** what data does this touch, create, copy, log, send or keep? Classify it:
   `standard`, `pii` (anything that identifies a person, including IDs, emails, IP addresses,
   device data, account handles linked to a person) or `phi` (health information). Unknown
   means sensitive.
2. **Role:** for this data, is the organization the **controller** (decides why) or a
   **processor** (acts on a customer's instructions)? Different duties follow.
3. **Boundaries:** which trust boundaries does it cross: tenant, user, service, vendor, region,
   client bundle, logs, AI model?
4. **Obligations:** which frameworks apply (see `references/frameworks.md`), and which control
   in the repo's control catalog owns this?
5. **Copies:** every new persistent copy (table, cache, log, file, backup, queue, vendor) has an
   owner, purpose, retention, deletion path and export path.

After implementing, validate the touched controls with evidence. High-risk changes need
**negative** evidence: the wrong tenant, role, expired credential or erased subject is refused.

## The rules

1. **Authentication is not authorization.** Check the exact role, ownership, organization and
   project at the last trusted boundary, deny by default, from server-side identity only. An ID
   in the input grants nothing.
2. **Tenant isolation everywhere the data goes:** queries, caches, files, exports, jobs, retries,
   logs, analytics, audit, backups.
3. **Minimize.** Collect, keep and send the least data that does the job. Off by default for
   anything optional (payload logging, analytics, tracking).
4. **Every copy has a retention rule and a deletion path,** including logs, caches, backups,
   replicas, vendor copies and restored state. Erasure removes the subject everywhere the
   retention rule does not legally require keeping it.
5. **No personal or health data in logs, traces, metrics, errors or analytics.** Redact at the
   one telemetry boundary; test it.
6. **Secrets never leave their store:** not in code, logs, client bundles, model context, URLs,
   error messages or tickets. Encrypt at rest and in transit; strong algorithms only.
7. **Audit what matters, once:** sign-ins, permission changes, credential access and rotation,
   exports, deletions, data-access by staff, with actor, tenant, target, time and outcome, and
   without sensitive content. Audit records are append-only and tamper-evident.
8. **Vendors are approved before data flows.** A new service that receives personal data needs
   a purpose, data list, region, DPA (and BAA for health data), and an entry in the processor
   register; customer data processors also go on the public subprocessor list with the notice
   the DPA promises. See `compliance vendor`.
9. **Health data fails closed.** No PHI flows without a signed BAA covering the whole path
   (ingress, storage, backups, logs, support, vendors, AI models). Encryption, SOC 2 or a
   vendor's "HIPAA eligible" label is not that approval.
10. **Consent and notice are real.** Consent is specific, recorded with version and time, as easy
    to withdraw as to give. Notice is given before collection, in plain words.
11. **Rights are buildable.** Access, export, correction, deletion and objection work through the
    product or a documented process within the legal deadline (one month GDPR, 45 days US
    states), with identity checks.
12. **AI features declare their data use.** Customer data is not used to train or evaluate
    models unless the contract and notice say so; model providers are vendors; users are told
    when they interact with AI where the law requires it.
13. **Security follows the standards.** Every change is checked against OWASP Top 10:2025 and,
    for APIs and AI features, the OWASP API and LLM Top 10; new areas are reviewed with ASVS 5.0
    Level 2. See `references/security.md`.
14. **Accessibility is a requirement,** not polish: WCAG 2.2 AA for product and public pages.
15. **Claims need evidence.** Never say a framework is "compliant", "certified" or "approved"
    without the evidence that word needs. See `references/claims.md`.
16. **Separate the five states:** designed, implemented in source, verified locally, deployed and
    verified, independently attested. None substitutes for another.
17. **Never inherit another project's** customers, contracts, approvals, certifications or claims.
18. **Use current primary sources.** Laws change; record the source and date for any
    obligation you rely on, and mark proposals and future dates as such.

## The floor

Never trade away, even under time pressure or for lean code: authorization checks, tenant
isolation, validation at trust boundaries, encryption of secrets and sensitive data, audit of
sensitive actions, erasure paths, breach notification duties, and the honesty of public claims.
Unresolved controls are recorded as blockers with an owner and next step; never waived silently,
never "evidenced" by invention.

## Before saying "done"

1. Did I record the data classes, role, boundaries and obligations for this change?
2. Is every new copy of personal data covered by retention, deletion and export?
3. Did I prove refusal for the wrong tenant, role and stale credential (high-risk changes)?
4. Is anything sensitive reaching logs, traces, errors, client code or a model?
5. Did any new vendor or data flow appear? Is it registered and approved?
6. Did any public, legal or marketing text change? Is every claim backed by evidence?
7. Do the repo's privacy policy, DPA, subprocessor list, retention schedule and records still
   match what the code does?

## Modes

| Say                   | Does                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------- |
| `compliance check`    | Reviews a diff against the gate and rules; one line per finding. `references/review.md`          |
| `compliance audit`    | The same across a repository, ranked by risk, with the missing evidence per framework.           |
| `compliance claims`   | Checks public, legal and marketing text against evidence; flags every unsupported claim.        |
| `compliance vendor`   | Walks a new service through approval: data, role, region, agreements, register, notice.         |
| `compliance records`  | Builds or updates the records of processing, retention schedule and assessments (DPIA, TIA, LIA). |

Modes report and draft; they change product code only when asked.

## References

- `references/frameworks.md`: what each law and assurance programme requires, when it applies, dates.
- `references/security.md`: OWASP Top 10:2025, API and LLM Top 10, ASVS 5.0, CWE, NIST, CIS, SLSA,
  and the practices every product needs. The everyday hardening checklist is at its end. Deep
  vulnerability hunting and full audits: the `security-audit` skill.
- `references/engineering.md`: the controls in code and infrastructure, with patterns.
- `references/artifacts.md`: every document and record, when it is needed, who owns it.
- `references/claims.md`: what may and may not be said publicly.
- `references/review.md`: formats for the modes.
