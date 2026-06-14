# What is BisonDB?

BisonDB is a single-node document database written from scratch in C++20, with a wire-protocol
server, an interactive shell, and a desktop GUI. It exists to answer one question thoroughly:
*what does it actually take to build a database?* — and to be a working, inspectable answer.

It is an educational and portfolio project. That framing is not an apology; it is a design
constraint that shaped every component, and this site documents those components honestly.

## What it does

- **Stores BSON documents** — the same binary format MongoDB uses. The codec passes the
  official BSON corpus tests for all 11 supported types and round-trips real `mongodump`
  files byte-for-byte.
- **Indexes with a hand-written on-disk B+Tree** — 4 KB slotted pages, order-preserving key
  encoding, page splits, crash recovery. No `std::map` behind the curtain, no storage
  libraries.
- **Survives crashes** — an append-only log is the source of truth; indexes are disposable
  caches that rebuild automatically after an unclean shutdown.
- **Plans queries** — equality and range filters use indexes when one exists, and
  `explain()` shows exactly what the planner chose and how many documents it touched.
- **Speaks a real protocol** — clients talk to `bisond` over TCP with length-prefixed BSON
  frames. The shell, the converter CLI, the GUI, and your own scripts all use the same
  protocol, [documented completely](/architecture/protocol).
- **Encrypts and authenticates** — since v1.2 the transport can run over **TLS** (`--tls`,
  TLS 1.2) and every connection must **log in** first. Users have one of three roles
  (`read` / `readWrite` / `admin`); passwords are Argon2id-hashed and sessions use in-memory
  tokens. The full model is on the [Security page](/reference/security).

## What it does NOT do

These are deliberate scope boundaries, not roadmap items hidden in fine print:

| Not supported | What that means |
|---|---|
| Multiple nodes | No replication, no sharding, no consensus. One process owns one data directory. |
| Transactions | Single operations are atomic with respect to crash recovery; multi-document transactions don't exist. |
| Compound / unique secondary indexes | Indexes cover one field each; only `_id` is unique. |
| Field removal in updates | `updateOne` supports `$set` only. |
| TLS 1.3 / per-collection ACLs | TLS is 1.2 only; roles are server-wide, not per database or collection. |
| Production workloads | See [the FAQ](/reference/faq) for an honest treatment of this question. |

It **does** authenticate and encrypt (since v1.2) — that used to be on this list and no
longer belongs here. See [Security](/reference/security).

## The pieces

| Component | What it is |
|---|---|
| `bisond` | The server daemon. |
| `bisonsh` | Interactive shell with a Mongo-like statement grammar. |
| `bisonc` | BSON ⇄ JSON converter and embedded-mode CLI. |
| **Prairie** | A Tauri + React desktop GUI in the spirit of MongoDB Compass. |

If you want to *use* it, start with the [Quickstart](/guide/quickstart). If you want to
understand how it works inside — the better reason to be here — start with the
[architecture overview](/architecture/overview).
