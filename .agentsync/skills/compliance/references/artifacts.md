# Documents and records

What must exist, when it is triggered, who owns it, where it lives. Keep one source per
document; public pages render from it. Never write a document that claims something the
product does not do.

## Public documents

| Document                     | Needed when                                                    | Must say                                                                                       |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Privacy policy               | Always, before collecting personal data                        | Who, what, why, legal basis, recipients, transfers, retention, rights, contact, changes, state-law notices |
| Terms of service             | Always for a hosted product                                    | Parties, service, fees, acceptable use, data and DPA, warranties, liability, law, changes     |
| Data processing agreement    | Processing personal data for customers (GDPR Art. 28, CCPA service provider) | Instructions, confidentiality, security measures, subprocessors and notice, assistance, breach notice, deletion, audits, transfers (SCCs) |
| Subprocessor list            | With a DPA                                                     | Each subprocessor, purpose, data, location; notice of changes                                  |
| Cookie policy                | Any cookies or similar storage                                 | Each cookie, purpose, type, expiry; how to change the choice                                   |
| SLA                          | When availability is promised                                  | Target, measurement, exclusions, credits, claim process                                        |
| Acceptable use policy        | Platforms others build on                                      | Prohibited uses, enforcement                                                                   |
| Security / trust page        | Selling to businesses                                          | Controls actually in place, assurance status stated honestly                                   |
| Accessibility statement      | Public product and site                                        | Standard targeted, known gaps, contact                                                         |
| BAA                          | Handling PHI for covered entities                              | HIPAA required terms; only once the PHI path is verified                                        |
| Status page                  | When availability matters to customers                         | Live state, incidents, maintenance; never security incidents                                    |

## Internal records

| Record                                   | Needed when                                             | Content                                                                 |
| ---------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------- |
| Records of processing (ROPA, Art. 30)    | GDPR applies (exemption for small firms rarely holds for SaaS) | Per activity: purpose, categories, recipients, transfers, retention, security |
| Processor / vendor register              | Any vendor receives personal data                       | Service, purpose, data, region, agreement, approval, review date        |
| Retention schedule                       | Always                                                  | Per data category: period, trigger, deletion method, legal basis        |
| DPIA                                     | High-risk processing (health data at scale, monitoring, AI on personal data) | Description, necessity, risks, measures, sign-off          |
| Transfer impact assessment (TIA)         | Transfers out of the EEA/UK on SCCs                     | Destination law, safeguards, supplementary measures                    |
| Legitimate interests assessment (LIA)    | Relying on legitimate interests                         | Purpose, necessity, balancing                                           |
| Breach and incident register             | Always                                                  | Every incident, decision to notify or not, reasons                      |
| Rights request log                       | Always                                                  | Request, identity check, deadline, outcome                              |
| Consent records                          | Consent is a basis                                      | Who, what, version, time, withdrawal                                    |
| Legal acceptance records                 | Click-through terms or DPA                              | User, document, version, time, fingerprint                              |
| Security policies (SOC 2 / ISO)          | Pursuing assurance                                      | Information security, access, change, incident, continuity, backup, vendor, classification, retention, risk, HR, training |
| Control matrix and evidence index        | Pursuing assurance                                      | Control to criterion to evidence source to frequency to owner          |
| Risk register                            | Pursuing assurance; good practice                       | Threats, likelihood, impact, treatment, owner                           |
| Asset inventory                          | Pursuing assurance; HIPAA                               | Systems, data, owners; no secrets                                       |

## Keeping them true

- Each document names the code, config or record it describes.
- A change that alters data, vendors, retention or security updates the affected documents in
  the same change, or files a task that blocks release.
- Review all of them at least yearly; date every version.
