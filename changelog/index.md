# Changelog

Release notes, grouped by product. Latest:

| Product | Version | Wire protocol |
|---|---|---|
| BisonDB engine | **v1.2.0** — TLS + authentication | v2 |
| Prairie (GUI) | **v1.2.1** — UI/UX + motion | v2 |

The engine and Prairie are in sync on wire protocol v2. Prairie requires a BisonDB
1.1.0-or-newer server. [Downloads are on the home page](/#download).

## BisonDB engine

The server (`bisond`), shell (`bisonsh`), CLI (`bisonc`), and the `bisondb_core` library.

### v1.2.0 — 2026-06-14

[Engine release](https://github.com/Abdullah-Masood-05/Bisondb/releases/tag/v1.2.0) ·
[Security guide](/reference/security)

TLS transport encryption. With `--tls`, the authentication handshake and all data travel
inside an encrypted session — completing the security story: an **encrypted, authenticated
transport** for single-node use.

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

### v1.1.0 — 2026-06-14

[Engine release](https://github.com/Abdullah-Masood-05/Bisondb/releases/tag/v1.1.0) ·
[Security guide](/reference/security)

Authentication. The engine now requires every connection to log in before any data command.
At this release there was **still no TLS** — credentials travelled in clear text (TLS landed
in v1.2.0).

- **Users, roles, and tokens.** Three roles — `read`, `readWrite`, `admin` — gate every
  command through a central capability check. Users live in a hidden `__auth.bsd` system
  file (never listed or exported). Passwords are **Argon2id**-hashed (memory-hard, via
  Monocypher) with per-user salts; a successful login issues a 256-bit session token whose
  **BLAKE2b-256 hash** alone is kept in memory.
- **Wire protocol → v2.** New `authenticate`, `authenticateToken`, `logout`, `createUser`,
  `dropUser`, `changePassword`, `listUsers` commands; new `AuthRequired` / `AuthFailed`
  (generic — no user enumeration) / `Forbidden` / `TokenExpired` error codes; `serverStatus`
  reports a `security` block. **Breaking for v1 clients** (which never authenticate); they
  are rejected once any user exists.
- **First-run bootstrap.** `bisond --init-admin <user>` (password from
  `$BISONDB_ADMIN_PASSWORD`), or a one-time bootstrap token printed to stderr, or the
  offline `bisonc auth create-admin --dir <dbdir> --username <u>`. No anonymous access once
  users exist; anti-lockout protects the last admin. A `--no-auth` dev escape hatch refuses
  non-loopback binds.
- **Clients.** `bisonsh` adds `--username`/`--token` and `auth login/logout/whoami/passwd/
  create-user/list-users/bootstrap`; `bisonc` remote commands accept `--username`/`--token`.
  Passwords are read from a no-echo prompt or the environment, never from the command line.

### v1.0.0 — 2026-06-13

[Engine release](https://github.com/Abdullah-Masood-05/Bisondb/releases/tag/v1.0.0)

First stable release.

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

## Prairie

The Compass-style desktop GUI (Tauri + React). Tracks the engine's wire protocol — now on
**v2** (auth + TLS).

### v1.2.1 — 2026-06-14

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.2.1). Fixes a logout
crash introduced by the route cross-fade (the workspace now reads its connection defensively
during the exit animation) and adds a slide transition between the Documents / Indexes /
Import-Export tabs.

### v1.2.0 — 2026-06-14

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.2.0). UI/UX elevation
and motion — restraint over effects, same dark amber-on-neutral theme.

- A design-token layer (surfaces, one accent, radii, elevation, type scale) on the **Inter**
  typeface; cohesive buttons / inputs / cards / modals / toasts.
- A small **motion** system (framer-motion): modal & toast transitions, route cross-fades, a
  capped document-list stagger, and skeleton loaders — all honoring `prefers-reduced-motion`.
- A **⌘/Ctrl-K command palette**, a polished connection-screen entrance, and friendlier
  auth/TLS error messages. No protocol change.

### v1.1.0 — 2026-06-14

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.1.0). Sync with
BisonDB v1.1.0+ (wire protocol v2): **authentication and TLS**.

- **TLS** with the server's verification modes (system trust / CA or self-signed file /
  SHA-256 pin / insecure), a workspace lock indicator, and local databases that run the
  bundled sidecar over a pinned self-signed cert (encrypted + verified, no login).
- **Authentication**: a login step and a first-run setup screen; session tokens stay in the
  Rust backend (never web storage) with transparent re-auth on expiry.
- **Admin Users panel** (create/reset-password/drop with roles) and a **role-aware UI**
  (read-only users have write controls disabled).
- Recent connections remember username + TLS prefs, never secrets.

### v1.0.3 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.3). Relicensed
from MIT to **GPL-3.0-or-later** to match the engine: full GPLv3 `LICENSE`, a GPL notice
header on every source file, and the bundled engine's license shipped as `LICENSE-bisond.txt`
beside `bisond` in the install directory.

### v1.0.2 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.2). Fix: opening a
local database no longer pops a visible `bisond.exe` console window on Windows — the sidecar
is spawned with `CREATE_NO_WINDOW`.

### v1.0.1 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.1). Fix: local
databases failed with *"bisond binary not found"* because the sidecar resolver only checked a
working-directory-relative path. It now searches the Tauri resource directory and several
executable-relative locations, and lists every path tried when the binary is genuinely absent.

### v1.0.0 — 2026-06-13

[Release](https://github.com/Abdullah-Masood-05/Prairie/releases/tag/v1.0.0). First stable
release, matching BisonDB v1.0.0 (wire protocol v1).

- Connection screen with remote servers, local databases via bundled bisond sidecar
  (ephemeral port, reaped on disconnect and window close), persisted recent connections.
- Document browser: paginated JSON tree with type badges, CodeMirror filter bar with
  linting, explain plans with index hints, per-collection filter memory.
- Mutations with guarded confirmations; `$set`-diff editing.
- Index management; import `.bson`/`.json`/`.jsonl` with progress; export json/jsonl/bson/csv.
- Wire-protocol version check with a blocking mismatch screen.
