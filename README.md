<div align="center">
  <img src="public/logo.png" alt="BisonDB logo" width="120" height="120" />
  <h1>BisonDB Documentation</h1>
  <p><strong>Source for the BisonDB documentation site.</strong></p>
  <p>
    <a href="https://github.com/Abdullah-Masood-05/bisondb-site/actions/workflows/deploy.yml"><img src="https://github.com/Abdullah-Masood-05/bisondb-site/actions/workflows/deploy.yml/badge.svg" alt="Deploy docs" /></a>
    <a href="https://github.com/Abdullah-Masood-05/bisondb-site/commits"><img src="https://img.shields.io/github/last-commit/Abdullah-Masood-05/bisondb-site?style=flat-square" alt="Last commit" /></a>
    <a href="https://github.com/Abdullah-Masood-05/bisondb-site/stargazers"><img src="https://img.shields.io/github/stars/Abdullah-Masood-05/bisondb-site?style=flat-square" alt="Stars" /></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Abdullah-Masood-05/bisondb-site?style=flat-square" alt="License" /></a>
    <img src="https://img.shields.io/badge/VitePress-1.x-5C73E7?style=flat-square&logo=vue.js&logoColor=white" alt="VitePress 1.x" />
    <a href="https://abdullah-masood-05.github.io/bisondb-site/"><img src="https://img.shields.io/badge/site-live-success?style=flat-square" alt="Live site" /></a>
  </p>
  <p>
    <a href="https://github.com/Abdullah-Masood-05/Bisondb">BisonDB engine</a> ·
    <a href="https://github.com/Abdullah-Masood-05/Prairie">Prairie GUI</a>
  </p>
</div>

The official documentation website for [BisonDB](https://github.com/Abdullah-Masood-05/Bisondb)
and [Prairie](https://github.com/Abdullah-Masood-05/Prairie), built with VitePress and
deployed to GitHub Pages. It documents both the engine and the GUI repos.

## Local development

```bash
bun install
bun run docs:dev       # http://localhost:5173
bun run docs:build     # production build (dead links fail the build)
bun run docs:preview
```

## Relationship to the source repos

The engine repo's `docs/` (notably `protocol.md`) remains the **technical source of
truth** that versions with the code. This site is the expanded public version: same facts,
more explanation, diagrams, and the download/landing experience. When behavior changes in
the engine, update the engine docs first, then mirror here.

## Updating benchmarks after a release

1. Run `bisonbench --json` on the release build (methodology on the benchmarks page).
2. Replace `public/data/benchmarks.json` (keep the `meta` block accurate: version,
   hardware, date).
3. The charts on `/benchmarks/` read that file at page load, so no code changes are needed.

## Structure

- `.vitepress/config.ts`: nav, sidebar, and theme config (note `base: '/bisondb-site/'` for
  project-pages hosting)
- `.vitepress/theme/`: palette overrides, the `DownloadSection.vue` component (using the GitHub Releases API with
  a static fallback), and the `BenchChart.vue` component (using Chart.js)
- `guide/ build/ architecture/ reference/ benchmarks/ changelog/`: content folders
- `public/`: logo, screenshots, and benchmark data

Deployment: pushes to `main` build and publish via GitHub Actions (`.github/workflows/`);
PRs run the build (including dead-link checking) as a required check.
