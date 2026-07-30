# Building on Windows (MSVC)

## Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Visual Studio 2022 / Build Tools | 17.x with the **C++ workload** | MSVC 19.3x+, C++20 required |
| CMake | **3.21+** | ships with VS 2022, or cmake.org |
| Git | any recent | |

MinGW-w64 (GCC 13+) also works; the repo ships `mingw-*` presets pointing at an MSYS2
toolchain; adjust the compiler paths in `CMakePresets.json` for your install.

## Build and test

```powershell
git clone https://github.com/Abdullah-Masood-05/Bisondb.git
cd Bisondb
cmake --preset msvc
cmake --build --preset msvc-release -j 6
ctest --preset msvc-release --output-on-failure
```

Binaries land in `build\msvc\Release\`: `bisond.exe`, `bisonsh.exe`, `bisonc.exe`. Use
`msvc-debug` presets for a debug build. Catch2 is fetched automatically on first configure
(network required once).

```powershell
.\build\msvc\Release\bisond.exe --dir data\db
```

## Troubleshooting

**`No CMAKE_CXX_COMPILER could be found` / missing VC++ toolset**: the C++ workload isn't
installed. Open *Visual Studio Installer* → Modify → check **Desktop development with
C++**. Configure from a *Developer PowerShell for VS 2022* if plain terminals can't find
the toolset.

**`CMake 3.21 or higher is required`**: an old standalone CMake shadows the VS one. Run
`cmake --version`; remove the stale PATH entry or install current CMake.

**FetchContent fails to download Catch2**: the first configuration needs network access to
GitHub. On a proxied machine set `HTTPS_PROXY`, or pre-clone Catch2 and point
`FETCHCONTENT_SOURCE_DIR_CATCH2` at it.

**`MSB8020: build tools for v143 cannot be found`**: the preset generates for VS 2022; an
older VS opened the folder. Delete `build\msvc` and reconfigure with VS 2022's tools.

**Tests fail with file-lock errors (`os error 32` style)**: antivirus scanning freshly
written test files. Re-run; persistent cases usually mean a real-time scanner is holding
temp `.idx` files. Exclude the build/temp directories.
