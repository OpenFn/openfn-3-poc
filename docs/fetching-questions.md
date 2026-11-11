# Fetching: the questions to decide as a team

The React app replaces Lightning's LiveView pages, so how it loads and keeps
data is ours to decide. LiveView gave us much of that without us choosing it.
This page shows how fetching works in openfn-3 today, then lists the
decisions we need to make together. Each one has the options and the way we
currently lean. None is final until we've talked it through.

## How it works today

### Where the truth lives

In LiveView the server keeps each open tab's state in memory, and the browser
only draws what it's sent. The browser's data can't go out of date, because
the browser holds none.

```
LiveView

  database ──► server process (one per tab, holds the rows)
                     │
                     ▼  HTML diffs
                  browser (just draws)
```

In React the browser asks the API, gets JSON, and keeps a copy. From then on
the copy and the database are separate, and the database can change without
the browser knowing.

```
React

  database ──► API ──► JSON ──► copy in the browser ──► page draws it
                                     ▲
                       goes out of date the moment
                       someone else changes the database
```

So a React app holds two kinds of state:

- **Server state** is a copy of something the server owns (work orders, a
  project's name). Others change it behind your back. It lives in TanStack
  Query's cache, and only `src/api/` touches that.
- **UI state** belongs to this tab alone (an open modal, the search text). It
  never goes stale. It's `useState` in the page, or the URL when it should
  survive a reload or a shared link.

Copying server state into `useState` makes a second copy that nothing keeps
fresh. That is the most common bug in this kind of code.

### The cache

TanStack Query keeps a map from a **query key** to the server's last answer.
The key holds everything that changes the answer, from general to specific:

```
["projects", "p1", "workflows", "stats", "-name"]
```

Because keys nest, you can mark a whole prefix out of date at once:
`["projects", "p1"]` covers the project and everything under it.

First visit to a page:

```
page asks for key ──► cache: nothing here ──► fetch ──► "loading"
                                                │
                                                ▼
                                       store answer under key ──► page draws
```

Coming back to it:

```
page asks for key ──► cache: have it ──► draw it at once
                                │
                                └──► stale? ──► refetch in the background
                                                  │
                                                  ▼
                                       swap in the new answer if it changed
```

Each entry has two clocks:

```
fetched ──[ fresh: staleTime ]──► stale ──── no page uses it ──[ gcTime ]──► deleted
                                    │
                      refetches when: a page using it mounts
                                      the window regains focus
                                      the network reconnects
```

- **`staleTime`**: how long an answer counts as fresh. While fresh, the cache
  serves it without asking. openfn-3 leaves it at the default, 0, everywhere
  except the project itself (60s, `src/api/projects.ts`).
- **`gcTime`**: how long an unused entry stays in memory. Default 5 minutes.
- Two pages asking for the same key at once share one request.
- A failed load is retried up to three times. A 4xx never is (`canRetry`).

### After a save

A save is a mutation. When it succeeds, the cache has to learn what changed.
There are two ways:

```
invalidate                                  write the reply in

save ──► server ──► 200                    save ──► server ──► 200 + the record
                     │                                          │
                     ▼                                          ▼
     mark keys under a prefix stale          setQueryData(key, record)
                     │                                          │
                     ▼                                          ▼
     every one of them on screen refetches   page redraws, no extra request
```

Invalidating is simple and always correct, but it costs a request for each key
it hits. openfn-ia-demo invalidates every workflow and project key after each
workflow save. Its editor autosaves 700ms after you stop typing, so every
pause refetches every list on screen.

### Lists

Lightning pages its lists: `page` and `page_size` (at most 100), with
`links.next` and totals (`api/conventions.md`). `listAll` in
`src/api/client.ts` follows `links.next` to the end. That's fine for a list
that stays small and dangerous for one that grows without limit:

```
bounded (workflows, credentials)         unbounded (work orders, runs, dataclips, logs)

listAll ──► 1–3 requests ──► all rows    listAll ──► thousands of requests ──► never loads
```

### Loading under a project

`ProjectGate` loads the project, and only then renders the page, which then
starts its own queries. That's a waterfall: the page's data waits for the
project's.

```
project  ████████
page               ████████████
         ──────────────────────► time
```

### Live updates

LiveView's History subscribes to `project:<id>`. When a run or work order
changes, each open tab's process reloads the work order with its runs and
steps from the database, and re-runs the search to see whether a new one
matches its filters (`lightning_web/live/run_live/index.ex`). So the cost is
open tabs × events, all paid by the server. React has no equivalent yet.
`UserSocket` has `workflow:*`, `run:*` and `ai_assistant:*` channels, but
none for a project's work orders.

A live update in React doesn't need to carry the data. It can just tell the
cache which entry is out of date:

```
the API gives the rows        the socket says "this changed"

   API ──► cache ◄── nudge ── socket ◄── Lightning broadcast
             │
             ▼
           page
```

## The decisions

### 1. What should `staleTime` be?

At 0, every page mount, tab focus and reconnect refetches every query on
screen. That's always correct, but on a real Lightning it multiplies requests
by users and tab switches.

- **a.** Keep 0 everywhere. Simple, chatty.
- **b.** One default (say 30s), and shorter for data that moves fast.
- **c.** Tiers by kind of data. For example: reference data that rarely
  changes (adaptors, the user, instance settings) at 5 minutes, records
  (projects, workflows, credentials) at 30–60s, and activity (work orders,
  runs) at 0 or driven by live updates.

Lean: **c**, with the tiers named in `src/api/` so a new hook picks one
rather than a number.

### 2. Do we keep refetch on window focus?

It's why a tab you come back to looks fresh, and it's also the main source of
repeat requests.

- **a.** Keep it, and let `staleTime` limit it.
- **b.** Turn it off by default, and turn it on for activity data.

Lean: **a**. Once `staleTime` isn't 0, focus only refetches what's really old.

### 3. What does a save refresh?

- **a.** Invalidate the narrowest prefix that holds what changed (that
  project's workflows, not every workflow everywhere).
- **b.** Write the server's reply into the cache with `setQueryData`, then
  invalidate only the lists it changes (counts, order).
- **c.** Optimistic updates: change the cache before the server answers, and
  roll back on failure.

Lean: **b** where the API returns the record (most `PATCH`/`PUT` do), **a**
otherwise. **c** only where waiting feels broken (a toggle), since rollback is
easy to get wrong. Whichever we pick, it goes in `.claude/rules/api.md` as a
rule, so the next hook copies it.

### 4. When may we load a whole list?

- **a.** Never: every list pages on the server.
- **b.** `listAll` only for lists that stay small by nature (a project's
  workflows, its members, credentials). Anything that grows with activity
  (work orders, runs, dataclips, log lines, audit events) pages and filters
  on the server.

Lean: **b**, with the "grows with activity" list written down.

### 5. Page numbers or "load more"?

The API gives page numbers and totals. History, audit and channel requests use
numbered pages today.

- **a.** Numbered pages, page in the URL, as Lightning does.
- **b.** Infinite scroll or "load more" (`useInfiniteQuery`).

Lean: **a** for the tables people filter and share links to. **b** only for
feeds such as log lines.

### 6. How do we fetch details for many rows?

Fetching one request per row (N+1) is fast against the fake server and slow
on a real one. openfn-ia-demo's editor fetches every version's document one by
one to fill the version picker.

- **a.** Never per row. Ask the API for it in the list (`include=`), in one
  batch (`?id=a,b,c`), or only when that row is opened.

Lean: **a**. Anything the API can't give in one go goes in
`docs/api-gaps.md`.

### 7. Do we fix the waterfall under `ProjectGate`?

- **a.** Leave it. One extra round trip per project page.
- **b.** Start the page's queries in parallel with the project's (route
  loaders that prefetch, or the page's `.query` file not waiting on the gate).
- **c.** Prefetch on intent: start loading a project when its link is
  hovered or focused.

Lean: measure first. **c** is cheap and helps most. **b** changes how routes
are built, so it needs agreement.

### 8. Live updates: polling, websockets, or both?

- **a.** Polling: refetch every few seconds while something on screen is
  still running, and stop when it's all finished. No server work, works with
  the fake server today.
- **b.** A Phoenix channel per project that sends thin events
  (`{ id, state, last_activity }`). The client patches rows already on screen,
  refetches page 1 (at most about once a second) for new ones, and shows "N
  new" on later pages.
- **c.** Fat events carrying whole records. Fewer requests, but the server
  loads the record for every event, which is the LiveView cost again.

Lean: **a** now, **b** when Lightning adds the channel, never **c**. Either way
the page and hooks stay the same; only what triggers the refresh changes. With
**b** in place, `staleTime` for that data can go up.

Questions inside 8, if we go with **b**:

- Which channel and topic: one per project, or per page?
- What happens on reconnect? (Our lean: refetch whatever's on screen, to cover
  missed events.)
- Do we stop listening when the tab is hidden?
- How do we limit a busy project sending hundreds of events a second?
  (Our lean: batch events and refetch at most once a second.)

### 9. How do autosaves avoid conflicting with each other?

Each save sends the `lock_version` it last saw. If a save and its refetch take
longer than the gap between saves, the next one sends an old `lock_version`
and the server refuses it as someone else's edit, when it was your own.

- **a.** One save in flight at a time. The latest edit waits, and earlier
  waiting edits are dropped.
- **b.** Take `lock_version` from each save's reply, not from the refetch.

Lean: **a** and **b** together. Only the editor autosaves today.

### 10. What do we measure?

Without a number, "too many requests" is a feeling.

- Requests per page load, and per minute on an idle open page.
- Time to first rows on History with a large project.
- Server cost per open History tab with live updates on, compared with LiveView.

Lean: count requests per page in the `.query` tests or in the fake server, so a
change that doubles them shows up in review.

## Already settled

- A project's page starts fresh when you switch project, so one project's
  form never carries into another's (openfn-3 #58).
- Only `src/api/` uses TanStack Query. Pages get data and `status` as props.
- A refetch keeps the old rows on screen, and another project's rows never
  show while the new one loads (`placeholderData` in `src/api/workflows.ts`).
- Failed loads retry, refusals (4xx) don't.
