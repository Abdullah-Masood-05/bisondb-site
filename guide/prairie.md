# Prairie — the GUI

Prairie is a desktop client for BisonDB in the spirit of MongoDB Compass, built with
Tauri 2 and React. It speaks the same wire protocol as every other client and adds one
trick the CLI tools don't have: it can run a **local database** with zero setup by spawning
a bundled `bisond` on a private port.

Download the installer from the
[Prairie releases page](https://github.com/Abdullah-Masood-05/Prairie/releases/latest)
or [build it from source](/build/prairie).

## Connecting

![Prairie connection screen](/screenshots/prairie-connection.png)

Two paths from the connection screen:

- **Connect to server** — host and port of a running `bisond`.
- **Local database** — pick (or create) a folder; Prairie starts a bundled `bisond`
  sidecar for it on an ephemeral port and shuts it down when you disconnect or close the
  app. Recent connections are remembered.

On connect, Prairie checks the server's protocol version and refuses to proceed against an
incompatible server with a clear explanation rather than failing on a later command.

## The workspace

![Prairie document browser](/screenshots/prairie-browser.png)

- **Sidebar** — collections with live document counts, create (name validation matches the
  server's rules), drop (type-the-name confirmation), and compact.
- **Documents tab** — paginated browser (20/page) rendering each document as a collapsible
  tree with type badges for ObjectId, dates, and Decimal128. Hover a document for copy,
  edit, and delete.
- **Query bar** — a CodeMirror editor with JSON linting; invalid filters disable Run with
  the lint message inline. Filters are remembered per collection.
- **Explain toggle** — runs the same filter through `explain` and shows the plan badge
  (`scan` / `index_range` / `index_point`), documents examined vs returned, and — when a
  single-field filter scans — a hint to create the index that would fix it.

## Editing and deleting

Inserts accept one document or an array, with server errors (like `DuplicateKey`) shown in
the modal. Edits compute the changed top-level fields and send them as a `$set` — removing
a top-level key is rejected with an explanation, because the wire protocol has no removal
operator.

Destructive actions are deliberately high-friction: per-document deletes confirm against
the `_id`, "Delete matching" shows the filter and its match count and requires typing
`DELETE`, and an empty `{}` filter adds an explicit *this deletes ALL documents* warning.

## Import / Export and indexes

- **Import**: `.bson` (concatenated documents, e.g. `mongodump` output), `.json`, or
  `.jsonl`, streamed in batches with a progress bar.
- **Export**: `json`, `jsonl`, `bson`, or `csv` (export-only; top-level fields become
  columns), for the whole collection or the current filter.
- **Indexes tab**: list, create (dotted paths allowed), and drop, with the build's
  documents-indexed count reported on creation.
