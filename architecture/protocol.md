# The wire protocol

Everything that talks to `bisond` (including `bisonsh`, `bisonc`, Prairie, and your code) uses one
protocol: **length-prefixed BSON documents over TCP**, strictly one request then one
response. It is small enough to implement a client in an afternoon; the
[engine repo's docs/protocol.md](https://github.com/Abdullah-Masood-05/Bisondb/blob/main/docs/protocol.md)
includes a from-scratch Python example.

::: warning Authenticated (v2)
Since wire protocol **v2**, a connection must authenticate (`authenticate` /
`authenticateToken`) before any data command. The transport can run over **TLS** to encrypt the connection. See the [Security page](/reference/security) for the auth and TLS models, roles, and
bootstrap flow; this page covers the framing and command set.
:::

## Framing

```
┌──────────────────┬──────────────────────────────┐
│ payloadLen (u32  │ payload: exactly one BSON    │
│ little-endian)   │ document, payloadLen bytes   │
└──────────────────┴──────────────────────────────┘
```

- Valid payload range: **5 bytes to 16 MiB**. A violating length means the byte stream is
  unrecoverable: the server sends a best-effort error frame and closes.
- A well-framed but *malformed* BSON payload is recoverable; the stream is still in sync,
  so the server answers with `ParseError`/`CorruptData` and keeps serving.
- **No pipelining.** One outstanding request per connection; open more connections for
  parallelism. Default port **27027**.

Requests are `{cmd: "<name>", ...args}`. Success: `{ok: true, ...}`. Failure:
`{ok: false, error: {code, message}}`.

## Error codes

| Code | Meaning |
|---|---|
| `BadRequest` | missing/mistyped argument, invalid collection name, off-loopback shutdown |
| `UnknownCommand` | unrecognized `cmd` |
| `ParseError` | malformed JSON/extended-JSON content |
| `CorruptData` | malformed BSON payload or unreadable stored data |
| `DuplicateKey` | `_id` already exists |
| `NotFound` | referenced item absent |
| `TooLarge` | frame or key size cap exceeded |
| `ServerBusy` | connection limit reached (sent on accept, then close) |
| `Internal` | anything unexpected (the catch-all that keeps workers alive) |

## Command catalog

Collection names match `[A-Za-z0-9_][A-Za-z0-9_-]{0,127}`.

| Command | Request args | Success payload |
|---|---|---|
| `ping` | none | `{}` |
| `serverStatus` | none | `name, version, protocolVersion: 2, security: { auth, tls, setupMode }`; authenticated callers also get `uptimeSec, connectionsCurrent, opCounters` |
| `listCollections` | none | `collections: [string]` |
| `createCollection` | `coll` | `created: bool` (false = existed) |
| `dropCollection` | `coll` | `dropped: bool` |
| `dbStats` | none | `collections: [{name, count, fileSizeBytes, indexes}]` |
| `insert` | `coll, documents: [...]` | `insertedIds: [ObjectId], insertedCount` |
| `find` | `coll, filter, limit?, skip?` | `documents, count` (+ truncation, below) |
| `deleteMany` | `coll, filter` | `deletedCount` |
| `updateOne` | `coll, filter, update: {$set: {...}}` | `matched, modified` |
| `createIndex` | `coll, field` | `built, docsIndexed, docsSkipped` |
| `dropIndex` | `coll, field` | `{}` |
| `listIndexes` | `coll` | `indexes: [string]` |
| `explain` | `coll, filter, limit?` | `plan: {plan, index?, docsExamined, docsReturned}` |
| `compact` | `coll` | `stats: {documents}` |
| `shutdown` | none | `{}`, then graceful stop (loopback peers only) |

### A worked example

Request (shown as JSON; it travels as BSON):

```json
{ "cmd": "find", "coll": "zips", "filter": { "pop": { "$gte": 40000 } }, "limit": 2 }
```

Response:

```json
{
  "ok": true,
  "documents": [
    { "_id": {"$oid": "5c8eccc1caa187d17ca6ed16"}, "city": "ALPINE", "pop": 40912, ... },
    { "_id": {"$oid": "5c8eccc1caa187d17ca6ed99"}, "city": "BESSEMER", "pop": 45481, ... }
  ],
  "count": 2
}
```

## find truncation: Cursors without cursors

A response must fit one 16 MiB frame. When results don't fit, the server returns what does,
plus:

```json
{ "ok": true, "documents": [...], "count": 812, "truncated": true, "skipNext": 812 }
```

The client re-issues the same filter with `skip = skipNext` until `truncated` disappears.
This is a deliberate simplification over server-side cursors: it is stateless on the
server, is trivially correct to implement, and its one weakness is that results can shift if the
collection mutates between batches, which is acceptable for this database's scope. Both bundled
clients (C++ and Rust) reassemble transparently.

## Versioning

`serverStatus.protocolVersion` is `2` (v2 added the [authentication](/reference/security)
handshake). Clients should check it on connect; Prairie blocks its workspace with an
explanation when the number doesn't match, rather than failing on a later command. Pre-1.0
servers don't report the field at all (treat as 0); v1 servers report `1` and have no auth.
