# Security

BisonDB offers an **encrypted, authenticated transport** for single-node use: **TLS** on the
wire plus user/role **authentication**. It remains single-node (no replication), and the
`--tls-insecure` / `--no-auth` escape hatches exist for development — so it is not a managed
service, but with TLS on, credentials and data are no longer exposed in clear text.

::: warning Turn TLS on
TLS is **opt-in** (`--tls`). Without it the transport is plain TCP — clear text — which is
fine for loopback development but never for a network. Authentication alone does **not**
encrypt anything.
:::

Authentication is **wire protocol v2**. A connection must authenticate before it can run any
data command; with `--tls` that handshake (and every frame) runs **inside a TLS session**.
The byte-level details are in the [wire protocol reference](/architecture/protocol); this
page is the operator's view.

## Secure quickstart

```bash
# 1. Generate a cert + key (self-signed; the key file is written 0600).
#    Use a real CA-signed cert in production.
bisonc tls gen-cert --out-dir ./tls --cn localhost

# 2. Start bisond with TLS and seed an admin (password from the environment).
export BISONDB_ADMIN_PASSWORD='choose-a-strong-one'
bisond --dir data/db --tls --tls-cert ./tls/cert.pem --tls-key ./tls/key.pem \
       --init-admin admin

# 3. Connect, trusting the self-signed cert (or pin its printed fingerprint).
bisonsh --connect localhost:27027 --tls-ca ./tls/cert.pem --username admin
```

## TLS

- **Library.** Mbed-TLS 3.6, vendored via FetchContent so the binaries stay dependency-free.
  TLS 1.2 (ECDHE + AES-GCM); TLS 1.3 is deferred (a config wrinkle in the current build).
- **Server certificate.** `--tls-cert <pem>` + `--tls-key <pem>` for an operator-provided
  cert (real CA-signed or internal), or `--tls-self-signed` to generate one in memory at
  startup — bisond prints its **SHA-256 fingerprint** to stderr so a client can pin it. The
  offline `bisonc tls gen-cert` is the recommended setup (a key file on disk, mode 0600).
- **Client verification** (secure by default — opt out is explicit and loud):
  - default (`--tls`): verify the cert against the **OS trust store** *and* the hostname;
  - `--tls-ca <pem>`: trust a specific CA / self-signed cert (the usual self-signed path);
  - `--tls-pin <sha256>`: accept exactly the cert with this fingerprint (pairs with the
    fingerprint that `--tls-self-signed` prints);
  - `--tls-insecure`: skip verification entirely — **dev only**, prints a warning, and the
    shell banner shows the connection as *ENCRYPTED but UNVERIFIED*.
- Private keys are never logged. Connecting with the wrong transport (plaintext vs TLS)
  fails fast with a message telling you to add or drop `--tls`.

## Users and roles


## Users and roles

Users are stored in a hidden system file, `<dbdir>/__auth.bsd`, that is **never** exposed
through `listCollections`, `dbStats`, `find`, or export. Each record holds a username, the
password hash + salt + KDF parameters, the user's roles, a creation timestamp, and a
disabled flag — **never a plaintext password**.

There are three roles, from least to most privileged:

| Role | Can do |
|---|---|
| `read` | `find`, `explain`, `listCollections`, `listIndexes`, `dbStats` |
| `readWrite` | everything `read` can, plus all data/schema mutations (`insert`, `updateOne`, `deleteMany`, `createCollection`, `dropCollection`, `createIndex`, `dropIndex`, `compact`) |
| `admin` | everything, plus user management (`createUser`, `dropUser`, `listUsers`) and `shutdown` |

Each command maps to one required capability (read / write / admin); the connection's roles
must grant it, or the server returns `Forbidden`. `shutdown` additionally requires a
**loopback** peer. Changing your *own* password is always allowed (with the old password);
resetting *another* user's password requires `admin`.

## How credentials are protected

- **Passwords** are hashed with **Argon2id** — a memory-hard KDF (RFC 9106), via the vetted
  [Monocypher](https://monocypher.org/) library — with a per-user random salt. The cost
  parameters are stored alongside each hash so they can be raised over time. Verification is
  constant-time.
- **Session tokens** are 256-bit values from the OS CSPRNG (`BCryptGenRandom` on Windows,
  `/dev/urandom` on POSIX). The server stores only a **BLAKE2b-256 hash** of each token, so
  a leak of the auth state never yields a usable token. Tokens have a TTL (default 1 hour),
  are checked on every command, and live only in memory — they are **lost on restart**, and
  clients simply re-authenticate.
- **No user enumeration.** A failed login returns a generic `AuthFailed` whether the username
  is unknown or the password is wrong, and the server spends comparable time in both cases.
- **Brute-force throttle.** Repeated failed logins on a connection incur an increasing delay.

## First-run bootstrap

On first start with no users, you avoid both lockout and insecure defaults in one of three
ways:

1. **Seed an admin from the environment** (recommended for automation):
   ```bash
   export BISONDB_ADMIN_PASSWORD='choose-a-strong-one'   # never a CLI arg
   bisond --dir data/db --init-admin admin
   ```
2. **Setup mode** — start without `--init-admin` and bisond prints a one-time **bootstrap
   token** to stderr. Use it exactly once to create the first admin (it must be an admin),
   after which setup mode ends and the token is void. In `bisonsh`:
   ```
   auth bootstrap admin
   ```
3. **Offline tool** — create an admin directly against the data directory, no server running:
   ```bash
   bisonc auth create-admin --dir data/db --username admin
   ```

There is **no anonymous access** once any user exists. Losing every admin credential means
re-bootstrapping (recover with the offline tool above).

## Using auth from the shell

```bash
# Prompted for the password (never pass it on the command line):
bisonsh --connect 127.0.0.1:27027 --username admin
# Or resume a session with a token:
BISONDB_TOKEN=… bisonsh --connect 127.0.0.1:27027
```

Inside `bisonsh`:

```
auth login <user>        # prompt for password and log in
auth whoami              # show the current user and roles
auth passwd [<user>]     # change a password (your own needs the old one)
auth create-user <u> [role…]   # admin: create a user (default role: read)
auth list-users          # admin: list users and roles
auth logout              # end the session
auth bootstrap <user>    # first-run: create the first admin from the token
```

## Dev escape hatch

`bisond --no-auth` disables authentication entirely. It **refuses to bind to any
non-loopback address** and prints a loud warning on every startup. Use it only for local
development.

## What's still missing

- **TLS 1.3** — the transport is TLS 1.2 today; 1.3 is deferred behind an Mbed-TLS config
  wrinkle. (TLS 1.2 with ECDHE + AES-GCM is still secure.)
- Persistent/long-lived API tokens (today's tokens are session-scoped and in-memory).
- Per-collection or per-database access control (roles are server-wide).
- Audit log shipping (auth events are logged locally, without secrets).
- Single-node only — no replication or failover.
