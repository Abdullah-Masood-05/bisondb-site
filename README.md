# bisondb-site

The official documentation website for [BisonDB](https://github.com/Abdullah-Masood-05/Bisondb)
and [Prairie](https://github.com/Abdullah-Masood-05/Prairie), built with VitePress and
deployed to GitHub Pages.

## Local development

```bash
bun install
bun run docs:dev       # http://localhost:5173
bun run docs:build     # production build (dead links fail the build)
bun run docs:preview
```

## Relationship to the source repos

The engine repo's `docs/` (notably `protocol.md`) remains the **technical source of
truth** — it versions with the code. This site is the expanded public version: same facts,
more explanation, diagrams, and the download/landing experience. When behavior changes in
the engine, update the engine docs first, then mirror here.

## Updating benchmarks after a release

1. Run `bisonbench --json` on the release build (methodology on the benchmarks page).
2. Replace `public/data/benchmarks.json` (keep the `meta` block accurate: version,
   hardware, date).
3. The charts on `/benchmarks/` read that file at page load — no code changes needed.

## Structure

- `.vitepress/config.ts` — nav/sidebar/theme config (note `base: '/bisondb-site/'` for
  project-pages hosting)
- `.vitepress/theme/` — palette overrides + `DownloadSection.vue` (GitHub Releases API with
  static fallback) and `BenchChart.vue` (Chart.js)
- `guide/ build/ architecture/ reference/ benchmarks/ changelog/` — content
- `public/` — logo, screenshots, benchmark data

Deployment: pushes to `main` build and publish via GitHub Actions (`.github/workflows/`);
PRs run the build (including dead-link checking) as a required check.
