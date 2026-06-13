---
layout: home

hero:
  name: BisonDB
  text: A document database built from scratch
  tagline: BSON storage, hand-written B+Trees, and a Compass-style GUI.
  image:
    src: /logo.png
    alt: BisonDB
  actions:
    - theme: brand
      text: Download
      link: '#download'
    - theme: alt
      text: Quickstart
      link: /guide/quickstart
    - theme: alt
      text: GitHub
      link: https://github.com/Abdullah-Masood-05/Bisondb

features:
  - icon:
      src: /icons/btree.svg
    title: A from-scratch B+Tree
    details: 4 KB slotted pages, order-preserving key encoding, splits, lazy deletion, and crash recovery — no std::map, no storage libraries. Verified by 100k-operation model fuzzing against an oracle.
    link: /architecture/btree
  - icon:
      src: /icons/shield.svg
    title: Crash-safe storage
    details: An append-only record log is the single source of truth. Indexes are disposable caches with a dirty flag — any unclean shutdown rebuilds them from the log.
    link: /architecture/storage
  - icon:
      src: /icons/braces.svg
    title: Real BSON compatibility
    details: The codec passes the official MongoDB BSON corpus for all 11 supported types, round-trips mongodump files byte-for-byte, and speaks Extended JSON v2.
    link: /architecture/bson
---

<div id="download"></div>

## Download

<DownloadSection />

## Sixty seconds in the shell

<div class="bisondb-terminal">
<pre><span class="dim">$</span> <span class="prompt">bisond --dir data\db</span>
<span class="out">[info] bisond listening on 127.0.0.1:27027</span>
<span class="dim">·</span>
<span class="dim">$</span> <span class="prompt">bisonsh</span>
<span class="out">BisonDB 1.0.0 @ 127.0.0.1:27027</span>
<span class="prompt">bisondb&gt;</span> db.zips.find({pop: {$gt: 100000}}).explain()
<span class="out">{ "plan": "scan", "docsExamined": 29470, "docsReturned": 4 }</span>
<span class="prompt">bisondb&gt;</span> db.zips.createIndex('pop')
<span class="out">{ "built": true, "docsIndexed": 29470 }</span>
<span class="prompt">bisondb&gt;</span> db.zips.find({pop: {$gt: 100000}}).explain()
<span class="out">{ "plan": "index_range", "index": "pop", "docsExamined": 4, "docsReturned": 4 }</span>
<span class="dim">index_range on "pop" — examined 4, returned 4</span></pre>
</div>

That `29470 → 4` collapse is the whole point of the [B+Tree](/architecture/btree).

<div style="margin-top:48px; padding-top:24px; border-top:1px solid var(--vp-c-divider); display:flex; gap:24px; font-size:0.9em;">
  <a href="https://github.com/Abdullah-Masood-05/Bisondb">Engine source</a>
  <a href="https://github.com/Abdullah-Masood-05/Prairie">Prairie source</a>
  <a href="https://github.com/Abdullah-Masood-05/Bisondb/blob/main/LICENSE">GPLv3 license</a>
</div>
