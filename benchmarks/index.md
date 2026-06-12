# Benchmarks

::: warning Placeholder data
The numbers below are **realistic placeholders** establishing the methodology and chart
pipeline. They will be replaced with measured `bisonbench --json` output; until then, treat
shapes as indicative and absolute values as illustrative. The honest-numbers policy applies
here hardest of all.
:::

## Methodology

- Single `bisond` instance, local loopback, default settings unless stated.
- Dataset: the 29,470-document ZIP-code collection used throughout these docs, plus
  synthetic documents for the 1M-row runs.
- Each measurement: warm-up run discarded, median of 5 reported.
- Hardware and exact versions are embedded in
  [`benchmarks.json`](https://github.com/Abdullah-Masood-05/bisondb-site/blob/main/public/data/benchmarks.json)
  alongside the data, so charts and provenance travel together.

## Insert throughput — the price of fsync

<BenchChart chart="insert-throughput" />

Batched inserts amortize the fsync; per-document fsync pays the full disk-flush latency on
every write. The ~25× gap is the storage layer's honesty made visible: durability is a real
cost, and the [append-only design](/architecture/storage) makes it a *single* fsync per
batch rather than one per touched file.

Reproduce: `bisonbench insert --docs 100000 --batch 500` vs `--batch 1`.

## The headline: indexed range vs full scan

<BenchChart chart="query-latency" />

Note the **log scale**. A full scan reads every document and runs the matcher on each; the
indexed query seeks the B+Tree and reads only matches. The gap widens linearly with
collection size — this chart *is* the [B+Tree page](/architecture/btree) in one picture.

Reproduce: `bisonbench query --filter '{pop:{$gte:40000}}' --with-index --without-index`.

## docsExamined — the same story without a stopwatch

<BenchChart chart="docs-examined" />

Latency depends on hardware; `docsExamined` doesn't. The planner's
[explain output](/architecture/query-engine#explain-annotated) reports it for any query —
this chart is simply `explain` run on the ZIP dataset before and after `createIndex('pop')`,
and you can reproduce it in the shell in four statements.

## What is deliberately *not* benchmarked

Comparisons against MongoDB/SQLite/Postgres. They would be misleading in both directions —
those engines do vastly more work per operation (transactions, WAL, statistics), and
benchmark theater is the opposite of this project's point. The numbers here measure
BisonDB against itself: the cost of durability and the value of an index.
