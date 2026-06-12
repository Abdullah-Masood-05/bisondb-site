# FAQ

## Is this production-ready?

**No, and it doesn't claim to be.** The honest version of that answer has two halves.

What it *does* have: acknowledged writes survive crashes (append-only log + torn-tail
recovery, tested), a fuzzed B+Tree (100k randomized operations against an oracle, multiple
seeds), a BSON codec validated against MongoDB's official corpus, sanitizer-clean test runs,
and an 8-thread concurrency soak. That is more verification than most hobby databases.

What it *doesn't* have is the part that makes databases production-grade: years of adverse
workloads, operational tooling (backups, monitoring, online migration), security of any
kind, and a second node to fail over to. "Production-ready" is earned in operations, not in
test suites. Use it to learn, to prototype, to demo — keep anything you'd cry about in
SQLite or Postgres.

## Why not just use MongoDB?

You should — for the things MongoDB is for. BisonDB exists for a different purpose: it's a
complete, readable answer to *how does a database actually work*. Every component — codec,
storage, B+Tree, planner, protocol — is small enough to read in a sitting and documented
[on this site](/architecture/overview) at the level of byte offsets and lock orders. You
can't read MongoDB's WiredTiger in an afternoon. Compatibility with BSON and `mongodump`
files is deliberate so that real data and real tools work while you explore.

## What would multi-node take?

A sketch of the smallest honest version — single-leader replication:

1. **Ship the log.** The append-only log is nearly a replication stream already; followers
   replay records exactly like crash recovery does today.
2. **A position vocabulary** — (term, offset) so followers know where they are, plus a
   handshake to catch up from any offset.
3. **Leader election and the split-brain problem** — this is where it stops being a
   weekend: you either implement Raft (log-shaped consensus, doable but subtle) or accept
   manual failover.
4. **Client routing** — writes to the leader, reads anywhere, with the consistency caveats
   that implies.

Steps 1–2 fit the existing architecture surprisingly well; steps 3–4 are why distributed
databases are their own field.

## Why is the default port 27027?

MongoDB's is 27017. Close enough to be an homage, different enough to run both at once.

## Can I use the data files from another machine / OS?

Yes — every on-disk integer is explicitly little-endian and the test suite round-trips the
formats. Copy the data directory while the server is *stopped*. (An unclean copy is also
fine in principle — indexes would just rebuild — but stop the server anyway.)

## Why did my unindexed query get slower as data grew?

Because it's a scan — by design it reads everything. Run `.explain()`, look at
`docsExamined`, and create the index it suggests. That this is visible and fixable in two
commands is the [whole demonstration](/architecture/query-engine).

## Does deleting documents shrink the files?

Not immediately — deletes append tombstones and old versions linger. Run
`db.<coll>.compact()`. See [storage](/architecture/storage#compaction).

## Where do bug reports go?

[Engine issues](https://github.com/Abdullah-Masood-05/Bisondb/issues) ·
[Prairie issues](https://github.com/Abdullah-Masood-05/Prairie/issues). A reproducible
`bisonsh --eval` script or a `.bson` file that misbehaves is the perfect report.
