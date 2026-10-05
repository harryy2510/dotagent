---
name: postgres
description: "Use when designing or reviewing PostgreSQL schemas, queries, indexes, row-level security, connection pooling, transactions and locking, pagination, bulk writes, migrations, or slow queries, with any client (Drizzle, Supabase, raw SQL). Prioritized rules with correct and incorrect SQL in references; based on Supabase's Postgres best practices (MIT), extended for this pack."
license: MIT (references derived from supabase/agent-skills postgres best practices)
---

# PostgreSQL

Rules by impact. Each reference file has the reason, incorrect and correct SQL, and how to verify
with `EXPLAIN`. ORM specifics live in `drizzle`; Supabase client and RLS-with-auth specifics in
`supabase-auth-data`.

## Hard rules

- **Migrations only.** Every schema change is a new migration file sorted after the latest; never
  edit, rename, reorder or squash an applied migration.
- **Agents never connect to or change a database** (`psql`, migration runners, `db push`) unless the
  user runs it. Write the migration and print the command.
- **Derive types from the schema** (Drizzle `$inferSelect`, generated types); no hand-written row
  types.
- **Every foreign key has an index**; every query path used in production has an index plan you
  checked.
- **Tenant isolation is enforced in the database** (row-level security or mandatory scoped
  queries plus constraints), tested with negative cases.
- **`timestamptz`** for time, **`text`** for strings (with check constraints for limits),
  **`bigint`/`numeric`** for money in minor units or exact decimals; never `float` for money.

## Rule categories

| Priority | Category                  | Prefix       |
| -------- | ------------------------- | ------------ |
| 1        | Query performance         | `query-`     |
| 2        | Connection management     | `conn-`      |
| 3        | Security and RLS          | `security-`  |
| 4        | Schema design             | `schema-`    |
| 5        | Concurrency and locking   | `lock-`      |
| 6        | Data access patterns      | `data-`      |
| 7        | Monitoring                | `monitor-`   |
| 8        | Advanced features         | `advanced-`  |

## References

**Query performance**
- `references/query-missing-indexes.md`: finding and adding missing indexes
- `references/query-index-types.md`: B-tree, GiST, GIN, BRIN
- `references/query-composite-indexes.md`: column order in multi-column indexes
- `references/query-covering-indexes.md`: index-only scans with `INCLUDE`
- `references/query-partial-indexes.md`: indexes for common `WHERE` filters

**Connections** (serverless and Workers need pooling: Hyperdrive, PgBouncer or the provider's pooler)
- `references/conn-pooling.md`, `references/conn-limits.md`, `references/conn-idle-timeout.md`,
  `references/conn-prepared-statements.md` (transaction-mode poolers and prepared statements)

**Security and RLS**
- `references/security-rls-basics.md`, `references/security-rls-performance.md` (wrap
  `auth.uid()`/settings in `(select ...)`, index policy columns)
- `references/security-privileges.md` (least-privilege roles: the app's runtime role is not the
  owner and cannot bypass RLS)
- `references/security-search-path.md` (`set search_path = ''` on `security definer` functions)

**Schema design**
- `references/schema-primary-keys.md` (identity, UUIDv7, prefixed ULIDs for public IDs)
- `references/schema-foreign-key-indexes.md`, `references/schema-data-types.md`,
  `references/schema-constraints.md`, `references/schema-lowercase-identifiers.md`,
  `references/schema-partitioning.md`

**Concurrency and locking**
- `references/lock-short-transactions.md`, `references/lock-deadlock-prevention.md`,
  `references/lock-advisory.md`, `references/lock-skip-locked.md` (job queues)

**Data access**
- `references/data-n-plus-one.md`, `references/data-batch-inserts.md`,
  `references/data-pagination.md` (keyset/cursor over offset), `references/data-upsert.md`

**Monitoring**
- `references/monitor-explain-analyze.md`, `references/monitor-pg-stat-statements.md`,
  `references/monitor-vacuum-analyze.md`

**Advanced**
- `references/advanced-full-text-search.md`, `references/advanced-jsonb-indexing.md`

## Safe migrations on live tables

- Add columns nullable or with a constant default; backfill in batches; then add `NOT NULL`
  (with a `NOT VALID` check constraint validated separately on large tables).
- Create indexes `CONCURRENTLY` on large tables (not inside a transaction).
- Never rename or drop a column the running app reads: expand (add new), migrate code, contract
  (drop old) across releases.
- Set `lock_timeout` for DDL so a migration fails fast instead of blocking traffic.

## Reviewing a query

1. `EXPLAIN (ANALYZE, BUFFERS)` on realistic data (on a local or staging copy the user runs).
2. Look for sequential scans on large tables, nested loops over many rows, sorts spilling to
   disk, row estimates far from actual.
3. Fix with the smallest change: an index, a rewritten predicate, keyset pagination, a batch.
4. Re-check the plan.
