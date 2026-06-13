# Quickstart

Download to first indexed query in under five minutes. No installer is required for the
engine — the binaries are fully static.

## 1. Get the binaries

Download the latest release for your platform from the
[releases page](https://github.com/Abdullah-Masood-05/Bisondb/releases/latest), or build
[from source](/build/windows). Unpack it anywhere.

## 2. Start a server

::: code-group

```powershell [Windows]
.\bisond.exe --dir data\db
```

```bash [Linux]
./bisond --dir data/db
```

:::

You'll see the startup banner, then a `listening` line and structured per-request logs:

![bisond startup banner and request log](/screenshots/bisond-banner.png)

The data directory is created on first use. `bisond` has **no authentication and no TLS** —
it binds to loopback by default and should stay there. `--quiet` suppresses the banner and
the per-request logging.

## 3. Open the shell

In a second terminal:

::: code-group

```powershell [Windows]
.\bisonsh.exe
```

```bash [Linux]
./bisonsh
```

:::

```
BisonDB 1.0.0 @ 127.0.0.1:27027
type 'help' for the statement grammar
bisondb>
```

## 4. Insert and query

The shell accepts relaxed JSON — unquoted keys, single quotes, trailing commas:

```
bisondb> db.people.insertMany([
...        {name: 'ada', born: 1815},
...        {name: 'grace', born: 1906},
...        {name: 'edsger', born: 1930},
...      ])
{ "insertedCount": 3, "insertedIds": [ ... ] }

bisondb> db.people.find({born: {$gt: 1900}})
{ "_id": {"$oid": "..."}, "name": "grace", "born": 1906 }
{ "_id": {"$oid": "..."}, "name": "edsger", "born": 1930 }
returned 2 in 0.4 ms
```

## 5. See the planner work

```
bisondb> db.people.find({born: {$gt: 1900}}).explain()
{ "plan": "scan", "docsExamined": 3, "docsReturned": 2 }

bisondb> db.people.createIndex('born')
{ "built": true, "docsIndexed": 3 }

bisondb> db.people.find({born: {$gt: 1900}}).explain()
{ "plan": "index_range", "index": "born", "docsExamined": 2, "docsReturned": 2 }
```

With three documents the difference is invisible; with 30,000 it is the difference between
reading everything and reading only the matches. The [benchmarks](/benchmarks/) quantify it,
and the [B+Tree page](/architecture/btree) explains the machinery.

## Next steps

- Take the full [shell tour](/guide/shell)
- Prefer a GUI? Install [Prairie](/guide/prairie)
- Import real data: `bisonc db import data\db zips zips.bson` works on any
  concatenated-BSON dump (e.g. `mongodump` output)
