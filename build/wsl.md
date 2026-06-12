# Windows + WSL

WSL2 gives Windows machines a real Linux toolchain — useful for running the sanitizer
presets (TSan does not exist on Windows) and for verifying Linux builds before CI does.
The one decision that matters is **where the source lives**.

## The dual-clone workflow

Keep two independent clones, each on its native filesystem:

```
C:\...\Bisondb          ← Windows clone, built with MSVC/MinGW
\\wsl$\...\~/Bisondb    ← WSL clone, built with GCC/Clang
```

Why not one clone shared through `/mnt/c`? Two reasons, both unfixable:

1. **`/mnt/c` I/O is drastically slower** — the 9P bridge makes compiles and the
   file-heavy test suite several times slower than ext4. Build output (`build/`,
   `.idx`/`.log` test files) hammers exactly this path.
2. **Line endings and file modes fight.** A shared working tree gets CRLF/LF churn and
   permission-bit noise between the two Gits.

Inside WSL:

```bash
sudo apt-get update && sudo apt-get install -y build-essential cmake ninja-build git clang
git clone https://github.com/Abdullah-Masood-05/Bisondb.git ~/Bisondb
cd ~/Bisondb
cmake --preset release && cmake --build --preset release -j"$(nproc)"
ctest --preset release --output-on-failure
```

Sanitizers (the real reason to bother):

```bash
CC=clang CXX=clang++ cmake --preset asan && cmake --build --preset asan && ctest --preset asan
CC=clang CXX=clang++ cmake --preset tsan && cmake --build --preset tsan && ctest --preset tsan
```

## Crossing the boundary deliberately

A Windows `bisonsh` can talk to a server inside WSL (WSL2 forwards localhost):

```powershell
# WSL terminal:   ./build/release/bisond --dir ~/data
# Windows terminal:
.\bisonsh.exe --connect 127.0.0.1:27027
```

Data directories are portable across OSes — all on-disk formats are explicitly
little-endian — but never let two servers (one per OS) open the *same* directory at once;
the engine has no cross-process locking.

## Troubleshooting

**Builds are 5–10× slower than expected** — your clone is under `/mnt/c`. Move it to the
ext4 home directory (`~/`); this is the single most common WSL mistake.

**`ctest` fails with clock-skew or stale-file oddities after editing from Windows** —
editing the WSL clone with a Windows editor through `\\wsl$` can produce out-of-order
mtimes. Edit with WSL-native tools or VS Code's WSL remote mode.

**WSL1** — upgrade. `wsl --set-version <distro> 2`. WSL1's filesystem emulation breaks the
fsync semantics the storage layer relies on for its crash-safety reasoning.

**Out of memory linking with many jobs** — WSL2 defaults to half your RAM. Lower `-j`, or
raise memory in `.wslconfig`.
