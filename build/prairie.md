# Building Prairie

Prairie lives in [its own repository](https://github.com/Abdullah-Masood-05/Prairie) with
its own toolchain; it does not participate in the engine's CMake build.

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| [bun](https://bun.sh) | 1.x | package manager and script runner |
| Rust | stable (1.80+) | via rustup; MSVC target on Windows |
| **A built `bisond`** | matching release | becomes the local-database sidecar |
| Linux only: WebKitGTK | `libwebkit2gtk-4.1-dev` etc. | see below |

```bash [Linux extra deps]
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev \
  libayatana-appindicator3-dev librsvg2-dev patchelf
```

## The sidecar step

Prairie bundles a `bisond` binary so "open a local folder" works without a separately
installed server. The copy script needs to know where your engine build lives:

::: code-group

```powershell [Windows]
git clone https://github.com/Abdullah-Masood-05/Prairie.git
cd Prairie
bun install
$env:BISONDB_BUILD_DIR = "..\Bisondb\build\msvc\Release"   # or your build dir
bun run copy-sidecar
```

```bash [Linux]
git clone https://github.com/Abdullah-Masood-05/Prairie.git
cd Prairie
bun install
BISONDB_BUILD_DIR=../Bisondb/build/release bun run copy-sidecar
```

:::

`BISONDB_BUILD_DIR` can also live in a `.env.local` file, or you can copy
`bisond(.exe)` into `src-tauri/bin/` by hand. The script errors loudly when it can't find
the binary.

## Develop and bundle

```bash
bun run tauri dev      # hot-reloading dev window
bun run tauri build    # installer: src-tauri/target/release/bundle/
```

Quality gates: `bun run test` (Vitest), `bun run lint` (ESLint), and `cargo test` inside
`src-tauri/` (wire framing, truncated-find reassembly, import/export converters).

## Troubleshooting

**"bisond binary not found" from copy-sidecar**: `BISONDB_BUILD_DIR` is unset or points to
a directory without `bisond(.exe)`. Build the engine first; the error message lists where
it looked.

**Local database opens fail with "did not become ready"**: the bundled sidecar cannot
start. Run `src-tauri/bin/bisond --help` directly; a MinGW-built binary needs to be the
*static* release build or its runtime DLLs are missing.

**`failed to remove ... (os error 32)` during cargo build**: a file lock from antivirus or
an IDE's rust-analyzer on `target/`. Re-run; exclude `target/` from real-time scanning.

**Linux: `webkit2gtk-4.1` not found**: install the dev packages above. On older distros
Tauri 2 needs the 4.1 series, not 4.0.

**File dialogs do nothing**: this is a Tauri *capabilities* problem; the shipped
`capabilities/default.json` must include `dialog:default`. If you fork the config, keep it.
