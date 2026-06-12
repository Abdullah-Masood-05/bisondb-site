# The shell — bisonsh

`bisonsh` is an interactive REPL with a Mongo-like statement grammar, multi-line input,
history, colored output, and a scriptable batch mode. It talks to a running `bisond` over
the wire protocol — it never opens data files directly.

```
bisonsh [--connect host:port] [--no-color] [--no-banner]
        [--eval '<stmt>[; <stmt>...]'] [-f script.bsh]
```

Default server: `127.0.0.1:27027`. With `--eval`, `-f`, or piped stdin the shell runs
non-interactively and exits non-zero on the first error.

## Statement grammar

JSON arguments are **relaxed**: unquoted keys (`$gt` included), single-quoted strings, and
trailing commas all work. Statements with unbalanced brackets continue on `...` lines; a
blank line cancels the pending statement.

### Reading

```
bisondb> db.zips.find()                          // {} filter implied
bisondb> db.zips.find({state: 'NY'})
bisondb> db.zips.find({pop: {$gte: 40000}}).limit(5).skip(10)
{ "_id": {"$oid": "5c8eccc1caa187d17ca6ed16"}, "city": "ALPINE", ... }
returned 5 in 1.2 ms
```

Chainable modifiers — `.limit(n)`, `.skip(n)`, `.explain()` — appear in any order, each at
most once. After 100 documents the interactive pager prompts `-- more (Enter) / q --`.

```
bisondb> db.zips.count({state: 'NY'})
1596
```

### Explain

```
bisondb> db.zips.find({pop: {$gte: 40000}}).explain()
{ "plan": "index_range", "index": "pop", "docsExamined": 1015, "docsReturned": 1015 }
index_range on "pop" — examined 1015, returned 1015
```

The summary line is the planner's verdict in one sentence; the
[query-engine page](/architecture/query-engine) decodes every field.

### Writing

```
bisondb> db.people.insertOne({name: 'ada', tags: ['math', 'computing']})
bisondb> db.people.insertMany([{a: 1}, {a: 2},])
bisondb> db.people.updateOne({name: 'ada'}, {$set: {born: 1815}})
{ "matched": true, "modified": true }
bisondb> db.people.deleteMany({a: {$lt: 2}})
{ "deletedCount": 1 }
```

Updates are `$set`-only — the protocol has no field-removal operator.

### Indexes and admin

```
bisondb> db.people.createIndex('born')        // or ({born: 1}), Mongo-style
bisondb> db.people.getIndexes()
_id
born
bisondb> db.people.dropIndex('born')
bisondb> db.people.compact()
bisondb> db.people.drop()
bisondb> show collections
bisondb> show status                          // serverStatus, pretty-printed
bisondb> help
bisondb> exit
```

## Error reporting

Parse errors show a caret diagnostic and never end the session:

```
bisondb> db.students.find({cgpa: {$gt 3.5}})
db.students.find({cgpa: {$gt 3.5}})
                             ^ expected ':' after key '$gt'
```

Server errors carry their protocol code:

```
E[DuplicateKey] duplicate _id: 507f1f77bcf86cd799439011
```

If the connection drops, the next statement attempts one transparent reconnect before
reporting a network error.

## Scripting

```bash
bisonsh --eval "db.t.insertOne({x: 1}); db.t.count()"
bisonsh -f setup.bsh
cat queries.bsh | bisonsh
```

Statements split on top-level `;` (semicolons inside strings or brackets are safe). The
first failing statement stops execution with exit code 1 — usable in CI.

## History and display

- History persists to `~/.bisonsh_history` (capped at 1000 entries).
- Output is colorized on TTYs with truecolor, 256-color, and 16-color fallbacks detected
  from `COLORTERM`/`TERM`; `--no-color` or `NO_COLOR` disables it.
- The startup banner appears only in interactive TTY sessions (`--no-banner` to suppress;
  `BISONDB_ASCII=1` forces a plain-ASCII variant).
