# Changelog

Release notes for both products. Engine and GUI version together: a Prairie release
requires the matching protocol version (currently **1**).

## v1.0.0 — 2026-06-13

First stable release. [Engine release](https://github.com/Abdullah-Masood-05/Bisondb/releases/tag/v1.0.0) ·
[Prairie release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.0)

### BisonDB engine

- BSON codec for 11 types, validated against the official corpus; Extended JSON v2
  (relaxed + canonical) read/write; byte-exact `mongodump` round-trips.
- Append-only collection store with torn-write recovery and compaction.
- On-disk B+Tree indexes: 4 KB slotted pages, order-preserving key encoding, splits, lazy
  deletion, free-list reuse, clean-flag crash detection — fuzzed with 100k operations
  against an oracle.
- Query engine: `$eq/$ne/$gt/$gte/$lt/$lte/$in/$and/$or`, dotted paths, index-aware
  planning with residual re-checks, `explain`.
- `bisond` server: framed-BSON wire protocol (v1, reported in `serverStatus`), 16-command
  catalog, graceful shutdown, thread-pooled connections.
- `bisonsh` interactive shell: relaxed JSON, multi-line input, caret diagnostics, history,
  colored output with gradient banner, scriptable `--eval`/`-f` modes.
- `bisonc` converter: BSON ⇄ JSON files, embedded and remote database operations.
- Windows x64 release binaries are fully static (no runtime DLLs).

### Prairie

- Connection screen with remote servers, local databases via bundled bisond sidecar
  (ephemeral port, reaped on disconnect and window close), persisted recent connections.
- Document browser: paginated JSON tree with type badges, CodeMirror filter bar with
  linting, explain plans with index hints, per-collection filter memory.
- Mutations with guarded confirmations; `$set`-diff editing.
- Index management; import `.bson`/`.json`/`.jsonl` with progress; export json/jsonl/bson/csv.
- Wire-protocol version check with a blocking mismatch screen.
