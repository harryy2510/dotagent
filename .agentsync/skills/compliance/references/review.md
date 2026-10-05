# Modes

All modes report and draft; they change product code only when the user asks.

## compliance check (a diff) and compliance audit (a repository)

One line per finding, most severe first:

`<severity> <file>:L<line>: <tag> <what>. <required control or evidence>.`

Severity: `blocker` (must fix before merge or release), `high`, `medium`, `low`.

Tags:

| Tag          | Finds                                                                             |
| ------------ | --------------------------------------------------------------------------------- |
| `authz:`     | Missing or weak authorization, ID from input trusted, default allow              |
| `tenant:`    | Data that can cross tenants (query, cache, file, job, export, log)               |
| `pii-log:`   | Personal or health data reaching logs, traces, metrics, errors, analytics        |
| `secret:`    | Secret in code, logs, URL, client bundle, model context, response                |
| `crypto:`    | Weak or custom crypto, missing encryption, TLS gaps                              |
| `retention:` | New copy of personal data with no retention or deletion path                     |
| `erasure:`   | A store the erasure or organization deletion does not reach                      |
| `vendor:`    | New external data flow not in the processor register or without an agreement    |
| `phi:`       | Health data path without BAA coverage or fail-closed gate                        |
| `audit:`     | Sensitive action not audited, or audit containing sensitive content              |
| `consent:`   | Tracking, cookies or marketing without consent or notice                         |
| `rights:`    | Data the access, export or deletion process cannot reach                         |
| `transfer:`  | New cross-border flow without a mechanism                                        |
| `ai:`        | Customer data to models or training without contract and notice; missing AI disclosure |
| `a11y:`      | Accessibility failure on a user-facing screen                                    |
| `claim:`     | Public or legal text the evidence does not support                               |
| `doc-drift:` | Privacy policy, DPA, subprocessors, retention schedule or records no longer match the code |

End with: `<B> blockers, <H> high. Frameworks touched: <list>. Documents to update: <list>.`
Nothing found: `No compliance findings. Gate recorded.`

`compliance audit` adds, per framework in scope, the missing evidence and the owner.

## compliance claims

For every claim in the given pages or text: `<page>: "<claim>": <supported | unsupported |
overstated> by <evidence or missing evidence>. <safer wording>.`

## compliance vendor

Walk through and record:

1. Service, exact products used, and products explicitly not used.
2. Data it receives (classes), and whether it is customer data (subprocessor) or the
   organization's own data (processor only).
3. Region and transfers; mechanism.
4. Agreements: DPA accepted (date), BAA if health data, their assurance (SOC 2, ISO) and date.
5. Retention and deletion at the vendor; zero-retention options.
6. Entry in the processor register; public subprocessor list and customer notice if it
   processes customer personal data (with the notice period the DPA promises).
7. Privacy policy update if it changes what users are told.

## compliance records

Create or update, from the code and configuration: records of processing, retention schedule,
DPIA/TIA/LIA where triggered. Each entry cites the code or config it describes.
