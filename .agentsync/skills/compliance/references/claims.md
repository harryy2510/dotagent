# Claims

Public text (website, docs, legal pages, sales answers, emails, UI) creates legal exposure when
it overstates. Every claim needs the evidence its words imply. When in doubt, say less and say
it precisely.

| Do not say                                   | Unless                                                    | Say instead (when true)                                              |
| -------------------------------------------- | --------------------------------------------------------- | -------------------------------------------------------------------- |
| "SOC 2 compliant" / "SOC 2 certified"        | Never "certified"; "has a SOC 2 Type II report" only with a current report | "SOC 2 Type II audit in progress" / "planned"         |
| "ISO 27001 compliant"                        | Certified by an accredited body, in scope                 | "Controls aligned with ISO 27001" (only if mapped)                   |
| "HIPAA compliant" / "HIPAA certified"        | Never "certified" (no such thing); "supports HIPAA" only with BAA and verified PHI path | "We do not sign BAAs today; do not send PHI" |
| "GDPR certified"                             | Never (no general GDPR certification exists)              | "We act as your processor under our DPA"                             |
| "Bank-grade" / "military-grade encryption"   | Never (meaningless)                                       | "AES-256-GCM at rest, TLS 1.3 in transit"                            |
| "We never store your data"                   | Literally true for every store, log and backup            | "Request bodies are off by default; when kept, 7 days"               |
| "End-to-end encrypted"                       | Only the endpoints hold the keys                          | "Encrypted in transit and at rest"                                    |
| "Anonymized"                                 | Re-identification is not reasonably possible             | "Pseudonymized" (when IDs are kept)                                   |
| "Zero data retention"                        | Nothing persists anywhere, including vendors and logs     | The exact retention per category                                     |
| "99.99% uptime"                              | Measured and published, or an SLA term with credits       | "99.99% SLA on Enterprise" (as a contract term)                       |
| "Fully secure", "unhackable"                 | Never                                                    | The concrete controls                                                 |
| "Compliant with all regulations"             | Never                                                    | The specific frameworks and status                                    |
| "We delete everything immediately"           | True for backups and vendors too                          | "Deleted from live systems at once; backups expire within 35 days"    |
| "Your data is never used to train AI"        | True for every model and vendor in the path               | Same sentence, once verified                                          |
| Customer logos, testimonials, counts         | Real, permitted, current                                  | Rounded marketing figures where the business decided so              |

Rules:

- Status words are exact: **designed**, **implemented**, **verified**, **in progress**,
  **certified/attested** (only with the document), **coming soon** (not built).
- Never inherit another company's claims or certifications, including a cloud provider's: "AWS
  is SOC 2 audited" does not make your product audited.
- Dates on anything time-bound ("as of", "audit expected").
- Legal pages and public claims change together with the product; a mismatch is a bug.
