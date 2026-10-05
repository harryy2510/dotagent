---
name: source-driven-development
description: "Use when correctness depends on a library's or framework's current API: writing framework-specific code, choosing between library APIs, upgrading or migrating versions, configuring tools, or reviewing code that may use stale APIs. Detect the installed version, read the official source for that version, implement, cite."
---

# Source-driven development

Write framework code from the installed version's official source, not from memory. Models are
trained on older APIs; libraries change monthly.

## When

- Any framework or library API you are not certain about for the installed version.
- Config keys, CLI flags, file names, migration steps.
- Upgrades and migrations.
- The user asks for "latest", "current", "official" or "best practice".

Skip for pure logic, renames, typos and repo-local conventions that do not depend on external
behaviour.

## Workflow

1. **Detect the exact version** from `package.json` and `bun.lock` (or `Cargo.toml`, `go.mod`,
   `pyproject.toml`), or the installed package's `package.json` in `node_modules`.
2. **Read the source for that version,** in this order:
   1. the installed package itself: its `.d.ts` types, README and `CHANGELOG.md` in
      `node_modules/<pkg>`; types are the ground truth for signatures;
   2. official docs for that major version (API reference, migration guide, release notes);
   3. official repository source and tests;
   4. standards documents (RFCs, WHATWG, TC39) and runtime compatibility data.
3. Community posts, issue comments and AI summaries are hints to verify, never the reason for
   production code.
4. **Implement the repo-local pattern** that matches the verified API (copy the nearest existing
   usage; `lean` rule 5).
5. If the docs conflict with existing code, say so and take the least disruptive consistent path
   unless the user asked to modernize.
6. **Cite** the deep link (not a homepage) in the final answer for non-obvious decisions; a code
   comment only when it saves a future maintainer a search.

## Upgrades

- Read every release note and migration guide between the current and target version.
- List breaking changes that touch this repo (search for each changed API).
- Propose the exact version change and wait for approval (`toolchain`: dependencies need
  approval).
- Upgrade one major at a time; run `bun run check` after each.
- Remove compatibility shims and deprecated usages in the same change.

## Rules

- Do not guess signatures, option names or defaults when the types or docs are cheap to read.
- Do not copy examples from a different major version.
- Mark anything you could not verify as unverified and keep the implementation conservative.
- Stop researching once the decision is supported.

## Output

- Stack and version detected.
- Sources used, each with the decision it supported.
- What changed.
- The check that verified it.
