# CLI reference

## bisond — the server

```
bisond --dir <dbdir> [--port N] [--bind ADDR] [--threads N] [--quiet]
```

| Flag | Default | Meaning |
|---|---|---|
| `--dir` | *(required)* | data directory (created if missing) |
| `--port` | `27027` | TCP port; `0` picks an ephemeral one |
| `--bind` | `127.0.0.1` | bind address — **no auth/TLS exists**; non-loopback is at your own risk and warns loudly |
| `--threads` | hardware concurrency | worker pool size |
| `--quiet` | off | suppress the banner and per-request logs |

Ctrl-C (or `SIGTERM`, or the loopback-only `shutdown` command) performs a graceful stop:
drain connections, sync every collection, exit 0 — index files reopen clean.

## bisonsh — the shell

```
bisonsh [--connect host:port] [--no-color] [--no-banner]
        [--eval '<stmt>[; <stmt>...]'] [-f script.bsh]
```

| Flag | Meaning |
|---|---|
| `--connect` | server endpoint (default `127.0.0.1:27027`) |
| `--eval` | run statements (split on top-level `;`), exit 1 on first error |
| `-f` | run a script file; piped stdin behaves the same |
| `--no-color` / `--no-banner` | display toggles (also: `NO_COLOR`, `BISONDB_ASCII=1`) |

Statement grammar: the [shell tour](/guide/shell).

## bisonc — converter and embedded CLI

File conversion (no server needed):

```
bisonc to-json <input.bson> [-o out.json] [--canonical] [--pretty]
bisonc to-bson <input.json> [-o out.bson]
bisonc inspect <input.bson>
```

`to-json` emits JSON Lines (one document per line) unless `--pretty`; `--canonical`
selects lossless Extended JSON so `to-json | to-bson` reproduces input byte-for-byte.
`inspect` prints document count, total bytes, and per-type value counts.

Database operations — embedded (opens `<dbdir>` directly, no server) or remote with
`--connect host:port` (then the dbdir argument is ignored; pass `-`):

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

## Exit codes (all three tools)

`0` success · `1` usage error · `2` runtime/processing error.
