# FAQ

## Is this production-ready?

**No, and it does not claim to be.** The honest version of that answer has two halves.

What it *does* have: acknowledged writes survive crashes using an append-only log with torn-tail
recovery, a fuzzed B+Tree (100k randomized operations against an oracle, multiple
seeds), a BSON codec validated against MongoDB's official corpus, sanitizer-clean test runs,
and an 8-thread concurrency soak. That is more verification than most hobby databases.

What it *doesn't* have is what makes databases production grade: years of adverse
workloads, operational tooling (backups, monitoring, online migration), and a second node to
fail over to. It now has an **encrypted, authenticated transport** using TLS and user/role
management with Argon2id-hashed passwords and session tokens (see [Security](/reference/security)). It
is no longer clear-text-only, but it is still **single-node**. "Production-ready" is
earned in operations, not in test suites. Use it to learn, prototype, or demo, but keep
any critical data in SQLite or Postgres.

## Is it secure? Can I expose it to the internet?

It now supports **TLS** (`--tls`) and **authentication**, so a single trusted node can be
reasonably locked down. But it is still single-node with development escape hatches
(`--tls-insecure`, `--no-auth`), no audit pipeline, and only TLS 1.2. Exposing it to the
public internet is not recommended. On a trusted LAN with TLS and authentication active, it is
secure. The full model (cert options, verification modes, roles, tokens, bootstrap) is on the
[Security](/reference/security) page; you must explicitly enable TLS since it is opt-in.

## Why not just use MongoDB?

You should, for the tasks MongoDB is built for. BisonDB exists for a different purpose: it is a
complete, readable answer to how a database actually works. Each component, including the codec,
storage, B+Tree, planner, and protocol, is small enough to read in a single sitting. They are documented
[on this site](/architecture/overview) at the level of byte offsets and lock orders. You
cannot read MongoDB's WiredTiger in an afternoon. Compatibility with BSON and `mongodump`
files is deliberate so that real data and real tools work while you explore.

## What would multi-node take?

A sketch of the smallest honest version using single-leader replication:

1. **Ship the log.** The append-only log is nearly a replication stream already; followers
   replay records exactly like crash recovery does today.
2. **A position vocabulary**: (term, offset) so followers know where they are, plus a
   handshake to catch up from any offset.
3. **Leader election and the split-brain problem**: this is where it stops being a simple
   weekend project. You must either implement Raft (log-shaped consensus, which is doable but subtle) or accept
   manual failover.
4. **Client routing**: writes go to the leader, and reads go anywhere, with the consistency caveats
   that implies.

Steps 1 and 2 fit the existing architecture well, while steps 3 and 4 show why distributed
databases are their own field.

## Why is the default port 27027?

MongoDB's is 27017. Close enough to be an homage, different enough to run both at once.

## Can I use the data files from another machine / OS?

Yes. Every on-disk integer is explicitly little-endian, and the test suite round-trips the
formats. Copy the data directory while the server is *stopped*. (An unclean copy is also
fine in principle because indexes will rebuild, but stop the server anyway.)

## Why did my unindexed query get slower as data grew?

Because it is a scan, which reads everything by design. Run `.explain()`, look at
`docsExamined`, and create the index it suggests. The fact that this is visible and fixable in two
commands is the [whole demonstration](/architecture/query-engine).

## Does deleting documents shrink the files?

Not immediately. Deletes append tombstones, and old versions linger. Run
`db.<coll>.compact()`. See [storage](/architecture/storage#compaction).

## Where do bug reports go?

[Engine issues](https://github.com/Abdullah-Masood-05/Bisondb/issues) ·
[Prairie issues](https://github.com/Abdullah-Masood-05/Prairie/issues). A reproducible
`bisonsh --eval` script or a `.bson` file that misbehaves is the perfect report.
