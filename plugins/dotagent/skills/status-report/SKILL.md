---
name: status-report
description: "Use when generating client-ready project status reports from git history, existing reports, trackers, docs, and codebase evidence."
---

# Status Report

Generate a polished stakeholder report from real project evidence. Git commits are the baseline source of truth; trackers and docs add context, not replacement facts.

## Core Rule

Always start from the newest existing report in `public/r/*/index.html` when one exists. Use the date that report was created as the lower bound for commits. Do not report work from before that date. Do not lower progress percentages that appeared in the previous report unless the user explicitly asks for a correction.

## Inputs To Gather

1. Existing reports:
   ```bash
   find public/r -mindepth 2 -maxdepth 2 -name index.html -print 2>/dev/null
   ```
   Sort reports by creation date, not hash directory name. Prefer the commit that added each report:
   ```bash
   git log --diff-filter=A --follow --date=iso-strict --format="%aI" -- public/r/<hash>/index.html
   ```
   If git has no creation record, use file modified time. Use in-file report dates only as a cross-check. Treat the newest report's creation date as the lower bound.

2. Git commits:
   ```bash
   git log --since="<last-report-date>" --no-merges --date=iso-strict --pretty=format:"%h%x09%aI%x09%s"
   ```
   If no previous report exists, use a narrow first window such as the past 7 days unless the user gives a start date.

3. Merged PRs when available:
   ```bash
   gh pr list --state merged --search "merged:>=<last-report-date>" --json number,title,mergedAt,url
   ```
   Skip this gracefully if `gh` is unavailable or the repo is not on GitHub.

4. Trackers, docs, and code:
   - Search for project trackers: `rg -n "roadmap|tracker|milestone|progress|status|phase|MVP|to do|backlog|done|in progress" README.md docs .agents 2>/dev/null`
   - Read relevant docs before summarizing roadmap or module status.
   - Deep dive into changed files from the commit window to translate implementation into user-visible outcomes.

## Progress Rules

- Parse previous percentages from the newest report and use them as floors.
- If current evidence cannot justify a higher percentage, carry the previous number forward.
- Never make the report period overlap the previous report.
- If a module was renamed, map it to the closest previous module instead of resetting progress to a lower value.
- Use percentages sparingly; they must reflect shipped or verifiable work, not optimism.

## Report Output

If `docs/status-update-template.html` exists, use it. If not, create a self-contained template that matches the product's brand, with inline CSS and:

- project name, date range, and update number
- overall progress
- module or workstream progress
- completed highlights from the commit window
- active work and next improvements
- blockers, risks, or decisions needed
- footer with `noindex, nofollow`

Save the report to:

```text
public/r/<random-16-char-hex>/index.html
```

Use an unguessable hash. Keep the HTML self-contained; avoid external dependencies except fonts already used by the project.

## Writing Standard

- Write for stakeholders, not implementers.
- Convert technical commits into outcomes, for example "faster onboarding" instead of route or schema names.
- Include technical notes only when they explain risk, delivery confidence, or an upcoming decision.
- Add an "Recommended Next Improvements" section when the code or tracker review reveals useful next work.
- Do not invent completion claims. Every highlight must trace back to commits, changed files, PRs, trackers, or docs.

## Completion

Report:
- selected previous report path and date
- git commit window used
- new report path
- notable source docs or trackers read
- any skipped optional source, such as unavailable `gh`

Do not commit or open a PR unless the user explicitly asks.
