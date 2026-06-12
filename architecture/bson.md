# The BSON engine

BSON is MongoDB's binary document format: length-prefixed, typed, and traversable without
parsing the whole document. BisonDB implements its own codec — encoder, decoder, and the
Extended JSON text mappings — and validates it against MongoDB's official conformance
corpus.

## The value model

In memory a document is a `Value`: a tagged union (`std::variant`) over the 11 supported
BSON types. Documents preserve insertion order — BSON is an *ordered* map, so the obvious
`std::map<std::string, Value>` would be wrong; internally it's a vector of key/value pairs
with linear key lookup.

| Type | Tag byte | Payload |
|---|---|---|
| Double | `0x01` | 8-byte IEEE 754, little-endian |
| String | `0x02` | i32 length **including** NUL, then UTF-8 bytes, then `0x00` |
| Document | `0x03` | a nested document (same format, recursively) |
| Array | `0x04` | a document whose keys are `"0"`, `"1"`, ... |
| ObjectId | `0x07` | 12 raw bytes |
| Bool | `0x08` | 1 byte, must be 0 or 1 |
| DateTime | `0x09` | i64 ms since epoch |
| Null | `0x0A` | nothing |
| Int32 | `0x10` | i32 |
| Int64 | `0x12` | i64 |
| Decimal128 | `0x13` | 16 raw bytes (IEEE 754-2008 BID) |

## Decoding a real document, byte by byte

The document `{"name": "ada", "age": 36}` is 27 bytes on the wire:

| Offset | Bytes (hex) | Meaning |
|---|---|---|
| 0–3 | `1B 00 00 00` | total document size = 27, little-endian |
| 4 | `02` | element type: String |
| 5–9 | `6E 61 6D 65 00` | key `"name"`, NUL-terminated cstring |
| 10–13 | `04 00 00 00` | string length 4 (3 chars + trailing NUL) |
| 14–17 | `61 64 61 00` | `"ada"` + NUL |
| 18 | `10` | element type: Int32 |
| 19–22 | `61 67 65 00` | key `"age"` |
| 23–26 | `24 00 00 00` | 36, little-endian |
| 27 | `00` | document terminator |

*(The terminator is byte 26 zero-indexed — the declared size counts it.)* Every structural
fact in that table is something a hostile input can lie about, which leads to:

## A decoder that assumes hostility

The decoder treats input as adversarial — the same bytes arrive from disk *and* from the
network. Every read is bounds-checked against both the buffer and the document's declared
size, and element parsing must land **exactly** on the terminator:

- declared size < 5 or beyond the available bytes → reject
- string length < 1, or extending past the document → reject
- a sub-document whose declared size eats its parent's terminator → reject
- bool bytes other than 0/1, unknown type tags → reject
- invalid UTF-8 in keys or strings → reject
- nesting beyond 200 levels → reject (this is a stack-overflow guard, not pedantry)

Every failure throws with the **byte offset** of the problem. There is no lookahead and no
"resync" — a framing violation means the stream cannot be trusted.

## Corpus testing

The decoder/encoder pair runs against the
[official MongoDB BSON corpus](https://github.com/mongodb/specifications/tree/master/source/bson-corpus)
for all 11 types: every canonical document must decode and re-encode to identical bytes,
every degenerate encoding must normalize to canonical, and every listed decode error must
throw. On top of that, the fixture suite round-trips real `mongodump` files —
29,470 ZIP-code documents re-encode byte-for-byte.

## Extended JSON

Text I/O uses MongoDB Extended JSON v2 in both modes:

- **Relaxed** — human-friendly: plain numbers, `{"$oid": "..."}`, ISO-8601 `$date`.
- **Canonical** — lossless: `{"$numberInt": "36"}` wrappers preserve exact types, so
  `bson → JSON → bson` reproduces the original bytes. The converter's round-trip tests
  depend on this.

The JSON parser is a from-scratch RFC 8259 recursive-descent parser (with surrogate-pair
handling and the same 200-level depth cap), extended with the `$`-wrapper folding — and,
for the shell, a relaxed mode accepting unquoted keys, single quotes, and trailing commas.

A note on Decimal128: BisonDB stores the 16 bytes opaquely and implements full
binary-integer-decimal **string conversion** in both directions (including the clamping and
non-canonical-significand rules), but no arithmetic — you can store and display `19.99`
exactly; you cannot ask the database to add to it.
