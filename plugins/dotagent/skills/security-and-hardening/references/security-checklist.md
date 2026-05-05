# Security Checklist

Use this as a focused review aid. Load only when a security-sensitive boundary is in scope.

## Auth And Authorization

- Server verifies identity from trusted session/token state.
- Authorization checks resource ownership, tenant, role, and action.
- Admin paths have server-side role enforcement.
- Client-provided user, role, tenant, price, or permission fields are ignored or revalidated.
- Session/cookie settings match the framework and deployment target.

## Input And Output

- Server validates input with the repo's schema/parser.
- URLs, redirects, file names, MIME types, and webhook events use allowlists.
- HTML/Markdown rendering sanitizes or escapes untrusted content.
- Errors sent to clients are stable and do not leak stack traces or provider payloads.
- Logs avoid secrets, tokens, full cookies, and unnecessary PII.

## Data And Secrets

- Database queries are scoped by tenant/user where required.
- RLS policies or server guards cover read and write paths.
- Secret changes are described for the user instead of editing `.env*`.
- External API keys stay server-side.
- Webhooks verify signatures and reject replay or unknown event types when the provider supports it.

## LLM And Agentic Systems

Use this section when prompts, model outputs, tool calls, MCP servers, RAG, embeddings, AI gateways, or autonomous workflows are in scope.

- Untrusted prompts, documents, URLs, and retrieved content cannot override system/developer instructions or tool constraints.
- Model output is validated or sanitized before it reaches HTML, SQL, shell, URLs, files, email, workflows, APIs, or other downstream interpreters.
- Tools, plugins, MCP servers, and connectors have least-privilege scopes; destructive, financial, external, or data-disclosing actions require explicit authorization.
- Prompts, logs, training data, RAG corpora, vector stores, and model-visible context exclude secrets, unnecessary PII, and cross-tenant data.
- Retrieval and vector search enforce tenant/user filters before retrieval, track source provenance, and have a path to remove poisoned or stale content.
- Model, provider, plugin, dataset, and package supply chains are inventoried, pinned or locked where possible, and reviewed before upgrades.
- Rate limits, token/output caps, cost budgets, timeouts, and loop guards cover model calls, retries, and recursive tool use.
- User-facing factual claims from LLMs use trusted-source verification or citations when accuracy, compliance, or safety matters.

## Release Checks

- Focused tests cover unauthorized, forbidden, invalid input, and cross-tenant attempts.
- Dependency or platform warnings relevant to the change were checked.
- Rollback does not require exposing or rotating secrets manually unless stated.

## Source Prompts

- OWASP Top 10 for LLM and GenAI Applications 2025: https://genai.owasp.org/llm-top-10/
- Cloudflare OWASP Top 10 for LLM risks primer: https://www.cloudflare.com/en-gb/learning/ai/owasp-top-10-risks-for-llms/
