# Building on Linux

## Prerequisites

| Tool | Version |
|---|---|
| GCC **12+** or Clang **15+** | C++20 support |
| CMake | **3.21+** |
| Ninja | any recent |

```bash [Debian/Ubuntu]
sudo apt-get update
sudo apt-get install -y build-essential cmake ninja-build git
# For Clang instead of GCC:
sudo apt-get install -y clang
```

## Build and test

::: code-group

```bash [GCC]
git clone https://github.com/Abdullah-Masood-05/Bisondb.git
cd Bisondb
cmake --preset release
cmake --build --preset release -j"$(nproc)"
ctest --preset release --output-on-failure
```

```bash [Clang]
CC=clang CXX=clang++ cmake --preset release
cmake --build --preset release -j"$(nproc)"
ctest --preset release --output-on-failure
```

:::

Binaries land in `build/release/`. The `debug` preset mirrors it; `asan` and `tsan`
presets build with sanitizers (Clang recommended) and run the same test suite. The
reader/writer concurrency test is specifically meant for TSan.

```bash
./build/release/bisond --dir data/db
```

## Troubleshooting

**`cmake: command not found` or version < 3.21**: Ubuntu 20.04's CMake is too old. Use
the [Kitware APT repo](https://apt.kitware.com/) or `pip install cmake`.

**`g++: unrecognized option '-std=c++20'` or concepts errors**: compiler is too old. Check
`g++ --version`; install `g++-12` (and select via `CXX=g++-12`).

**Preset not found**: CMake < 3.21 silently ignores `CMakePresets.json`. Same fix as
above.

**Linker errors about `pthread`**: this should not happen (Threads is linked via CMake), but if
a custom toolchain drops it, add `-DCMAKE_EXE_LINKER_FLAGS=-pthread`.

**ASan preset fails to link with GCC**: use Clang for the sanitizer presets:
`CC=clang CXX=clang++ cmake --preset asan`.
