# Changelog

Release notes for both products. They normally track the same wire protocol, but are
**temporarily out of sync**: the engine is at **v1.1.0 (protocol v2, authentication)** while
Prairie is at **v1.0.3 (protocol v1)**. Prairie will move to protocol v2 with a login flow
after the TLS phase; until then it shows a mismatch screen against a v1.1.0 server.

## v1.2.0 — 2026-06-14

TLS transport encryption. With `--tls`, the auth handshake and all data now travel inside an
encrypted session — completing the security story: **encrypted, authenticated transport** for
single-node use. See the [Security](/reference/security) page.

### BisonDB engine

- **TLS 1.2 (ECDHE + AES-GCM)** via Mbed-TLS 3.6 (vendored through FetchContent, so the
  binaries stay dependency-free). All TLS lives behind a `net::Stream` abstraction; the
  framing/commands above it are unchanged. (TLS 1.3 is deferred behind a config wrinkle.)
- **Server:** `bisond --tls` with `--tls-cert`/`--tls-key`, or `--tls-self-signed` (prints a
  SHA-256 fingerprint to pin). The TLS handshake runs in the worker thread under a timeout, so
  a stalled/malicious handshake can't block accepting.
- **Clients:** `bisonsh` and `bisonc` gain `--tls` / `--tls-ca` / `--tls-pin` /
  `--tls-insecure`; verification is secure by default (OS trust store + hostname). The shell
  banner shows a transport indicator (verified / ENCRYPTED-but-UNVERIFIED / not-encrypted).
- **Tooling:** `bisonc tls gen-cert --out-dir <dir>` writes `cert.pem` + a `0600` `key.pem` —
  the recommended setup over runtime self-signing.
- Private keys are never logged; a plaintext↔TLS mismatch fails fast with a guiding message.

### Prairie

- Still unchanged (protocol v1). A protocol-v2 + auth + TLS client update is planned.

## v1.1.0 — 2026-06-14

Authentication. The engine now requires every connection to log in before any data command.
**There is still no TLS** — credentials and data travel in clear text, so this remains a
loopback/trusted-LAN tool until the TLS phase. See the [Security](/reference/security) page.

### BisonDB engine

- **Users, roles, and tokens.** Three roles — `read`, `readWrite`, `admin` — gate every
  command through a central capability check. Users live in a hidden `__auth.bsd` system
  file (never listed or exported). Passwords are **Argon2id**-hashed (memory-hard, via
  Monocypher) with per-user salts; a successful login issues a 256-bit session token whose
  **BLAKE2b-256 hash** alone is kept in memory.
- **Wire protocol → v2.** New `authenticate`, `authenticateToken`, `logout`, `createUser`,
  `dropUser`, `changePassword`, `listUsers` commands; new `AuthRequired` / `AuthFailed`
  (generic — no user enumeration) / `Forbidden` / `TokenExpired` error codes; `serverStatus`
  reports a `security: { auth, tls:false, setupMode }` block. **Breaking for v1 clients**
  (which never authenticate); they are rejected once any user exists.
- **First-run bootstrap.** `bisond --init-admin <user>` (password from
  `$BISONDB_ADMIN_PASSWORD`), or a one-time bootstrap token printed to stderr, or the
  offline `bisonc auth create-admin --dir <dbdir> --username <u>`. No anonymous access once
  users exist; anti-lockout protects the last admin. A `--no-auth` dev escape hatch refuses
  non-loopback binds.
- **Clients.** `bisonsh` adds `--username`/`--token` and `auth login/logout/whoami/passwd/
  create-user/list-users/bootstrap`; `bisonc` remote commands accept `--username`/`--token`.
  Passwords are read from a no-echo prompt or the environment, never from the command line.

### Prairie

- No change yet. Prairie pins wire protocol v1 and will show its mismatch screen against a
  v1.1.0 server; a protocol-v2 + login update is planned next.

## Prairie v1.0.3 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.3). Relicensed
from MIT to **GPL-3.0-or-later** to match the engine: full GPLv3 `LICENSE`, a GPL notice
header on every source file, and the bundled engine's license shipped as `LICENSE-bisond.txt`
beside `bisond` in the install directory.

## Prairie v1.0.2 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.2). Fix: opening a
local database no longer pops a visible `bisond.exe` console window on Windows — the sidecar
is spawned with `CREATE_NO_WINDOW`.

## Prairie v1.0.1 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.1). Fix: local
databases failed with *"bisond binary not found"* because the sidecar resolver only checked a
working-directory-relative path. It now searches the Tauri resource directory and several
executable-relative locations, and lists every path tried when the binary is genuinely absent.

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
