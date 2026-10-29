---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "scripts/**"
  - "eslint.config.js"
---

# Comments

A comment tells the reader something the code can't. A wrong comment
teaches people to skip the next one, and agents act on every comment they
read, so a wrong one misleads twice. Write fewer, and keep them true.

## When a comment earns its place

Keep a comment only if it gives one of these:

- a constraint the names don't show,
- a decision a competent reader would otherwise reverse ("Enter submits even
  when a field is invalid, so the errors show"),
- a workaround for something outside the repo (jsdom, Headless UI, Monaco),
- where a rule comes from (the Lightning file or view it copies).

Anything else goes. If a comment is there because the code is unclear,
rename or extract instead.

```ts
// jsdom has no ResizeObserver, and Floating UI watches the open tooltip with one.
globalThis.ResizeObserver ??= class { … };
```

## Which kind

- **JSDoc on an export** (`/** … */`): what it is for and what the caller
  gets. Editors show it on hover without the source, so the first sentence
  stands alone. On a component's props, one line per prop that isn't obvious
  from its name and type.
- **`//` in a body**: why this line is like this, for someone already reading
  it.
- **An `eslint-disable`** always gives a reason after ` -- `. A reason
  starting `debt:` is work still to do; `wiring:` is a seam crossing that
  stays.

## JSDoc says what happens, not the steps

Say what the inputs must be, what comes back (including a rejected promise)
and any effect the caller can't see (a toast, a navigation, a request).
Don't walk through the body in order; that breaks the moment someone
reorders it.

```ts
/**
 * Runs `fn` and tracks it: `pending` until it settles, `error` if it throws.
 * A second call while pending is ignored unless `latest` is set.
 */
```

## What a comment never says

- What the next line plainly does (`// set the name`).
- The history of the code ("used to", "now", "no longer", "after the
  refactor"). That belongs in the commit message.
- Ticket numbers, commit hashes, PR numbers or chat decisions. Say the rule
  itself.
- A promise about code elsewhere that nothing checks ("the only caller
  passes…"). Make it a type or a test instead.
