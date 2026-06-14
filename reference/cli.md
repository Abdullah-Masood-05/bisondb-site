# CLI reference

Every flag of every tool, current as of **v1.2.x**. For the security model behind the auth
and TLS flags, see [Security](/reference/security); for the statement grammar, the
[shell tour](/guide/shell).

## bisond — the server

```
bisond --dir <dbdir> [--port N] [--bind ADDR] [--threads N] [--quiet]
       [--init-admin <user>] [--no-auth] [--token-ttl <sec>]
       [--tls] [--tls-cert <pem>] [--tls-key <pem>] [--tls-self-signed]
```

### Core

| Flag | Default | Meaning |
|---|---|---|
| `--dir` | *(required)* | data directory (created if missing) |
| `--port` | `27027` | TCP port; `0` picks an ephemeral one |
| `--bind` | `127.0.0.1` | bind address |
| `--threads` | hardware concurrency | worker pool size |
| `--quiet` | off | suppress the banner and per-request logs |

### Authentication

Authentication is **enabled by default** — a connection must log in before any data command.

| Flag | Default | Meaning |
|---|---|---|
| `--init-admin <user>` | — | on the **first run with no users**, create this admin from `$BISONDB_ADMIN_PASSWORD` |
| `--token-ttl <sec>` | `3600` | session-token lifetime in seconds |
| `--no-auth` | off | **DANGER** — disable auth entirely; refuses any non-loopback bind and warns loudly. Dev only. |

On first start with no users and no `--init-admin`, `bisond` prints a one-time **bootstrap
token** to stderr; use it once to create the first admin (see
[Security → First-run bootstrap](/reference/security#first-run-bootstrap)).

### TLS

| Flag | Meaning |
|---|---|
| `--tls` | encrypt the transport (TLS 1.2, ECDHE + AES-GCM); requires a cert + key |
| `--tls-cert <pem>` | PEM certificate (chain) file |
| `--tls-key <pem>` | PEM private key file |
| `--tls-self-signed` | generate an in-memory self-signed cert at startup and print its **SHA-256 fingerprint** for client pinning (no `--tls-cert`/`--tls-key` needed) |

Without `--tls` the transport is **unencrypted** — credentials and data travel in clear text.
Use `bisonc tls gen-cert` to make a cert/key pair. Private keys are never logged.

Ctrl-C (or `SIGTERM`, or the loopback-only `shutdown` command) performs a graceful stop:
drain connections, sync every collection, exit 0 — index files reopen clean.

## bisonsh — the shell

```
bisonsh [--connect host:port] [--no-color] [--no-banner]
        [--username <user>] [--token <token>]
        [--tls] [--tls-ca <pem>] [--tls-pin <sha256>] [--tls-insecure]
        [--eval '<stmt>[; <stmt>...]'] [-f script.bsh]
```

| Flag | Meaning |
|---|---|
| `--connect` | server endpoint (default `127.0.0.1:27027`) |
| `--username <user>` | log in as this user; the password is **prompted** (no echo) or read from `$BISONDB_PASSWORD` |
| `--token <token>` | resume a session with a token (or set `$BISONDB_TOKEN`) |
| `--tls` | verify against the **system trust store** + hostname |
| `--tls-ca <pem>` | trust a specific CA / self-signed cert (the usual self-signed path) |
| `--tls-pin <sha256>` | accept exactly the cert with this fingerprint (pairs with `--tls-self-signed`) |
| `--tls-insecure` | skip verification — **dev only**, warns; banner shows *ENCRYPTED but UNVERIFIED* |
| `--eval` | run statements (split on top-level `;`), exit 1 on first error |
| `-f` | run a script file; piped stdin behaves the same |
| `--no-color` / `--no-banner` | display toggles (also: `NO_COLOR`, `BISONDB_ASCII=1`) |

::: warning Never put a password in argv
Pass `--username` and let the shell prompt, or set `BISONDB_PASSWORD` / `BISONDB_TOKEN`.
The shell never accepts a password as a command-line argument.
:::

Statement grammar and the in-shell `auth …` account commands: the [shell tour](/guide/shell).

## bisonc — converter and database CLI

### File conversion (no server needed)

```
bisonc to-json <input.bson> [-o out.json] [--canonical] [--pretty]
bisonc to-bson <input.json> [-o out.bson]
bisonc inspect <input.bson>
```

`to-json` emits JSON Lines (one document per line) unless `--pretty`; `--canonical`
selects lossless Extended JSON so `to-json | to-bson` reproduces input byte-for-byte.
`inspect` prints document count, total bytes, and per-type value counts.

### Database operations

Embedded (opens `<dbdir>` directly, no server) **or** remote with `--connect host:port`
(then the dbdir argument is ignored — pass `-`):

```
bisonc db import       <dbdir> <coll> <file.bson|file.json>
bisonc db find         <dbdir> <coll> '<filter-json>' [--limit N] [--explain]
bisonc db delete-many  <dbdir> <coll> '<filter-json>'
bisonc db create-index <dbdir> <coll> <field>
bisonc db drop-index   <dbdir> <coll> <field>
bisonc db indexes      <dbdir> <coll>
bisonc ping   --connect host:port
bisonc status --connect host:port
```

::: warning Embedded mode and running servers
Embedded mode opens the data directory in-process. Never point it at a directory a running
`bisond` owns — there is no cross-process locking.
:::

### Remote auth and TLS

Every `db` / `ping` / `status` command run with `--connect` accepts the same auth and TLS
flags as the shell (a running server requires login):

| Flag | Meaning |
|---|---|
| `--username <user>` | log in; password prompted or from `$BISONDB_PASSWORD` |
| `--token <token>` | resume with a token (or `$BISONDB_TOKEN`) |
| `--tls` / `--tls-ca <pem>` / `--tls-pin <sha256>` / `--tls-insecure` | same verification modes as `bisonsh` |

```bash
# Load a mongodump into a running, TLS-protected server:
BISONDB_PASSWORD=… bisonc db import - zips zips.bson \
    --connect localhost:27027 --tls-ca ./tls/cert.pem --username admin
```

### Admin and TLS helpers

```
bisonc auth create-admin --dir <dbdir> --username <u>
        Create an admin offline (password from $BISONDB_ADMIN_PASSWORD or prompt),
        no server running — the recovery path if every admin credential is lost.

bisonc tls gen-cert --out-dir <dir> [--cn localhost] [--days 365]
        Write cert.pem + key.pem for `bisond --tls` (key file is mode 0600).
        The recommended way to make a cert, over runtime --tls-self-signed.
```

## Exit codes (all three tools)

`0` success · `1` usage error · `2` runtime/processing error.
