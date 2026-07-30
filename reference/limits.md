# Limits

Hard numbers first, then the behavioral boundaries. Every value here is enforced in code,
not aspirational.

## Size and structural limits

| Limit | Value | Behavior at the boundary |
|---|---|---|
| Wire frame (request or response) | 16 MiB | oversized request → connection closed; oversized result set → truncated response with `skipNext` |
| BSON document nesting | 200 levels | decoder, encoder, and JSON parser all reject deeper |
| Encoded index key | 512 bytes | document is skipped by that index (counted in `docsSkipped`), still found by scans |
| B+Tree page | 4096 bytes | fixed at build time |
| Index entry value | 64 bytes | internal cap (offsets are 8 bytes) |
| Collection name | 128 chars, `[A-Za-z0-9_][A-Za-z0-9_-]*` | `BadRequest` |
| Client-side find reassembly (Prairie/Rust client) | 10,000 docs | hard stop to protect the UI |
| Concurrent connections | 64 (configurable) | `ServerBusy` frame, then close |
| History entries (bisonsh) | 1000 | oldest trimmed |

## Type-level limits

- **Indexable types**: Null, numbers, String, ObjectId, Bool, DateTime. Documents, arrays,
  Decimal128, and NaN are not indexable; the index skips these documents.
- **Numbers in index keys** normalize to double: integers beyond 2⁵³ may compare equal to
  neighbors *inside an index*. The matcher itself compares exactly.
- **Decimal128** is for storage and display only (full string conversion, no arithmetic).
- **`_id`** must be an ObjectId (auto-generated when absent) and is the only unique index.

## Operational boundaries

| Boundary | Consequence |
|---|---|
| TLS is opt-in (`--tls`) | with `--tls` the transport is encrypted (TLS 1.2); without it, plain TCP (clear text). TLS 1.3 is not supported yet (see [Security](/reference/security)) |
| Authentication required | every connection must authenticate before data commands; `read`/`readWrite`/`admin` roles gate capabilities |
| Session tokens are in-memory | tokens are lost on server restart; clients re-authenticate (default TTL 1h) |
| One process per data directory | no cross-process locking; two servers on one dir corrupt it |
| One writer per collection at a time | bulk writes serialize (readers proceed concurrently) |
| `$set`-only updates | no field removal, no `$inc`/`$push` |
| No `$or` index planning | top-level `$or` always scans |
| Missing fields ≠ null | missing matches only `$ne`; absent from indexes |
| Deleted space persists | until `compact`, which also rebuilds all indexes |
| Unclean shutdown | indexes rebuild on next open. This causes an O(data) startup but results in zero data loss for acknowledged writes |
