# Frameworks

Status as researched on **2026-10-05**. Laws and guidance change: re-check the primary source
before relying on a date, and record the source and date you used. This is engineering
guidance, not legal advice; a lawyer decides applicability for a specific business.

Contents: privacy (EU, UK, Switzerland, ePrivacy, US states, Canada, Brazil, India, Japan,
Australia, China, Singapore, Korea, children), US breach laws and FTC, e-signatures, health
(HIPAA, HITRUST), assurance (SOC 2, ISO 27001 family, HITRUST, FedRAMP, CSA STAR, Cyber
Essentials), payments (PCI DSS), AI (EU AI Act, California ADMT), security regulation (NIS2,
DORA), accessibility, marketing email, sanctions and export. Security standards (OWASP, ASVS,
NIST, CIS) are in `security.md`.

---

## GDPR (EU), UK GDPR, Swiss FADP

**Applies when** you are established in the EU/UK/Switzerland, or offer goods or services to, or
monitor, people there. Applies to B2B too: your customers' staff and end users are people.

**Roles:** controller (decides purposes) or processor (acts on documented instructions). Most
SaaS is controller for its own account and marketing data and processor for customer data.

**Engineering obligations:**

- Lawful basis per purpose (contract, legitimate interests, consent, legal obligation); record it.
- Data minimization, purpose limitation, storage limitation (retention per category).
- Security of processing (Art. 32): encryption, access control, resilience, restore, testing.
- Data protection by design and by default (Art. 25): optional processing off by default.
- Rights (Art. 15-22): access, rectification, erasure, restriction, portability, objection;
  answer within one month (extendable by two).
- Records of processing (Art. 30): controller and processor records.
- DPIA (Art. 35) before high-risk processing (large-scale sensitive data, systematic monitoring,
  new tech such as AI on personal data).
- Breach notification: to the supervisory authority within 72 hours of awareness (controller);
  processors notify the controller without undue delay; data subjects when high risk.
- Processors: Art. 28 contract (DPA) with each customer; sub-processors authorized with notice.
- International transfers (Ch. V): adequacy, Standard Contractual Clauses (2021/914) with a
  transfer impact assessment, UK IDTA or Addendum, Swiss adaptation. EU-U.S. Data Privacy
  Framework: valid (upheld by the General Court, Sept 2025); appeal C-703/25 P pending at the
  Court of Justice. Companies not self-certified rely on SCCs.
- Representative (Art. 27) when not established in the EU/UK but in scope, unless occasional
  low-risk processing.
- DPO only when core activities are large-scale monitoring or special-category data.

**Special categories** (health, biometrics, etc.): an Art. 9 condition on top of a lawful basis;
higher security; usually a DPIA.

## ePrivacy (EU cookie rules) and UK PECR

Storing or reading anything on a device (cookies, local storage, pixels, fingerprinting) needs
prior consent unless strictly necessary for the service the user asked for. Consent: opt-in,
granular, recorded with version and time, withdrawable as easily. Analytics usually needs
consent in the EU (limited exemptions in some countries; the UK Data (Use and Access) Act 2025
adds an exemption for low-risk analytics as its provisions commence). Electronic marketing to individuals: opt-in (soft opt-in for
existing customers).

## US state privacy laws

California CCPA/CPRA plus about 19 other comprehensive state laws in effect in 2026 (Virginia,
Colorado, Connecticut, Utah, Texas, Oregon, Florida, Montana, Delaware, Iowa, Nebraska, New
Hampshire, New Jersey, Tennessee, Minnesota, Maryland, Indiana, Kentucky, Rhode Island).

**Applies when** thresholds are met (CCPA: annual revenue over US$26,625,000, or 100,000+
California consumers or households, or 50% of revenue from selling/sharing data; other states
use consumer-count thresholds). Many apply to B2B contacts too.

**Engineering obligations:** notice at collection; rights to know, access, delete, correct,
port, opt out of sale/sharing, targeted advertising and profiling; honor Global Privacy
Control; sensitive personal information limits; service-provider contracts (the "service
provider/contractor" terms in the DPA); 45-day response; appeals in most states.

**California regulations finalized Sept 2025 (in force 2026):** automated decision-making
technology (pre-use notice, opt-out, access) for significant decisions, compliance by
**January 1, 2027** for ADMT already in use; risk assessments before high-risk processing
(ongoing activities assessed by **December 31, 2027**); annual cybersecurity audits with
executive attestation for businesses whose processing presents significant security risk
(phased by revenue).

## Other privacy laws (outside the EU, UK and US)

Apply when you offer services to people in these countries; most follow the GDPR model
(notice, lawful basis or consent, rights, security, breach notice, transfer rules).

| Law                                   | Notes                                                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Canada: PIPEDA, Quebec Law 25         | Consent-based; Quebec requires a privacy officer, privacy impact assessments, breach register, transfer assessments |
| Brazil: LGPD                          | GDPR-like; legal bases, DPO (encarregado), breach notice to ANPD, international transfer rules (SCC-style clauses since 2024) |
| India: DPDP Act 2023 and Rules 2025   | Rules notified Nov 13, 2025; consent managers from Nov 13, 2026; **full compliance by May 13, 2027** (notice, consent, security, breach reporting, rights, retention limits) |
| Japan: APPI                           | Purpose specification, cross-border transfer consent or equivalent measures, breach reporting            |
| Australia: Privacy Act 1988 (APPs)    | Amendments in force from 2024-2026 (statutory tort, automated decision transparency from Dec 2026)       |
| China: PIPL                           | Separate consent for sensitive data and transfers; security assessments or standard contracts for exports; localization for some |
| Singapore: PDPA; South Korea: PIPA    | Consent, breach notice, transfer limits                                                                  |

## US breach notification and consumer protection

- **All 50 states** have breach notification laws (notify residents and often the attorney
  general; deadlines from 30 to 60 days in many states; encryption safe harbors vary).
- **FTC Act Section 5:** deceptive or unfair privacy and security practices. Saying you do
  something you do not (for example "encrypted", "we never sell data") is deceptive; see
  `claims.md`. The FTC Health Breach Notification Rule covers health apps outside HIPAA.

## Electronic signatures

Click-through acceptance of Terms and DPAs is valid under ESIGN and UETA (US) and eIDAS (EU)
when you record who accepted, what version, when and how, and can reproduce the exact text
(store the version and its fingerprint).

## Children

COPPA (US, under 13), GDPR Art. 8 (under 13-16 by country), UK Age Appropriate Design Code.
B2B products state they are not directed to children and do not knowingly collect their data.

## HIPAA (US health data)

**Applies when** you are a covered entity, or a business associate creating, receiving,
keeping or sending protected health information (PHI) for one. A business associate needs a
signed BAA with each covered entity customer and with its own subcontractors that touch PHI.

**Engineering obligations (Security Rule):** risk analysis and management; access control
with unique user IDs; audit controls; integrity; person/entity authentication; transmission
security; encryption (addressable today); contingency plan (backups, disaster recovery,
emergency mode); workforce training; incident procedures; breach notification (to the covered
entity without unreasonable delay, no later than 60 days; HHS and individuals by the covered
entity); documentation kept **6 years**.

**Pending change:** the Security Rule NPRM (published January 6, 2025) would make encryption and
MFA mandatory, require asset inventories and network maps, annual compliance audits,
restoration within 72 hours and more. As of mid-2026 **no final rule**; status uncertain.
Design to it anyway: it reflects current expectations.

**Fail closed:** no PHI without the BAA chain and a verified PHI-eligible configuration for every
service on the path. A cloud vendor's "HIPAA eligible" list is not coverage until the BAA is
signed and only listed services are used.

## SOC 2

An **independent examination** by a CPA firm against the AICPA Trust Services Criteria
(2017, points of focus revised 2022): Security (common criteria CC1-CC9, required),
Availability, Confidentiality, Processing Integrity, Privacy (optional). Type I: controls
designed at a point in time. Type II: controls operating over a period (3-12 months).

It is a **report**, not a certification. Before the report exists you may say "SOC 2 Type II
in progress" or "audit planned", never "compliant" or "certified".

**What it needs from engineering:** a control matrix mapped to the criteria; policies;
evidence that controls operate over time (access reviews, change reviews, monitoring,
incident response, vendor reviews, backups and restore tests, training, background checks,
risk assessment); a gap register with owners.

## ISO/IEC 27001:2022

A **certification** of an information security management system (ISMS) by an accredited
body: scope, risk assessment and treatment, Statement of Applicability against Annex A (93
controls), internal audit, management review. Transition from the 2013 version ended
October 31, 2025. ISO/IEC 27701 adds privacy (now standalone, 2025 edition).

## Other assurance programmes buyers ask for

| Programme                       | What it is                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| HITRUST CSF (e1, i1, r2)         | Certifiable framework common with US healthcare buyers; maps HIPAA, NIST, ISO                 |
| FedRAMP / StateRAMP (GovRAMP)    | Required to sell cloud services to US federal / state agencies                                |
| CSA STAR (levels 1-2)            | Cloud Security Alliance self-assessment (CAIQ) and third-party attestation                    |
| ISO/IEC 27017, 27018, 42001      | Cloud security controls; protection of personal data in public clouds; AI management systems |
| Cyber Essentials (UK)            | Basic certification required by many UK public-sector buyers                                  |
| SOC 3                            | Public summary of a SOC 2 report, safe to post on a trust page                               |

Answering security questionnaires (SIG Lite, CAIQ, custom): reuse one maintained answer
library mapped to the control matrix; never answer beyond the evidence.

## PCI DSS 4.0.1

**Applies when** you store, process or transmit cardholder data. Use a payment provider's hosted
fields or checkout so card data never touches your servers: the scope shrinks to SAQ A (since the
PCI SSC's January 2025 update, SAQ A eligibility requires confirming the payment page is
protected from script-based attacks). Never log, store or pass card numbers.

## EU AI Act

**Applies to** providers and deployers of AI systems in the EU market.

- **In force:** prohibited practices (since Feb 2, 2025); AI literacy duty; general-purpose AI
  model obligations (since Aug 2, 2025).
- **Since Aug 2, 2026:** Article 50 transparency (tell people they are interacting with AI;
  label synthetic content and deepfakes), AI Office enforcement, governance.
- **Deferred by the Digital Omnibus** (Official Journal July 24, 2026; in force July 27, 2026):
  Annex III stand-alone high-risk systems to **December 2, 2027**; Annex I (AI in regulated
  products) to **August 2, 2028**.

Most developer tools and agent infrastructure are not high-risk by themselves; customers who
use them for employment, credit, education, biometrics and similar decisions may be. Provide
the information customers need (documentation, logging, human oversight hooks) and do not
market prohibited uses.

## NIS2 and DORA (EU)

**NIS2:** applies to medium and large entities in listed sectors, including digital
infrastructure, cloud and managed services; incident reporting (24-hour early warning,
72-hour notification), risk management, supply-chain security, management accountability.
Check national transposition and the size threshold.

**DORA** (since January 17, 2025): EU financial entities and their ICT third-party providers;
financial customers will push contract clauses (audit, exit, incident reporting, subcontracting)
onto SaaS vendors.

## Accessibility

- **WCAG 2.2 AA** is the working standard.
- **European Accessibility Act**, applied from June 28, 2025, to listed consumer products and
  services (e-commerce, banking, e-books, transport ticketing) sold in the EU; B2B-only tools
  are largely outside, but consumer-facing screens a product renders for its customers' users
  may be inside.
- **ADA** (US) Title III litigation applies WCAG to websites; Section 508 for federal buyers.
- Publish an accessibility statement and a contact for problems.

## Marketing and transactional email

CAN-SPAM (US): honest headers and subject, physical address, working unsubscribe honored in
10 business days. CASL (Canada): express or implied consent. PECR/ePrivacy (UK/EU): opt-in
for individuals. Transactional and security emails are not marketing; never mix marketing into
them.

## Sanctions and export controls

US OFAC sanctions (comprehensively sanctioned countries and listed persons), EU and UK sanctions;
US EAR for encryption software (most mass-market SaaS qualifies for license exceptions; check
classification). Block sign-ups and payments from sanctioned regions where required; keep the
Terms clause.

## Sector and contract requirements that appear in sales

Customers bring their own: GLBA and NYDFS (US finance), FERPA (education), CJIS (law
enforcement), FedRAMP (US federal), state student-privacy laws, data residency demands,
security questionnaires (SIG, CAIQ), penetration test letters. Record each as a contract
obligation, not a law that applies to everyone.
