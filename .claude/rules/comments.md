---
paths:
  - "src/**/*.ts"
  - "src/**/*.tsx"
  - "scripts/**"
  - "eslint.config.js"
---

# Comments

A comment says what the code can't: a constraint, a decision someone would
otherwise reverse, a workaround for something outside the repo, or what
Lightning does that this copies ("Lightning rejects YAML over 8MB"). Nothing
else.

- JSDoc on an export says what it's for and what the caller gets, not the
  steps.
- An `eslint-disable` gives a reason after ` -- ` (`debt:` to fix, `wiring:`
  to keep).
- A rule several files rely on is explained once, in the file that enforces
  it. The others say nothing.
- When you change behaviour, fix any comment it made false, props' JSDoc
  included.
- Never: what the next line does, the code's history, ticket or PR numbers,
  file paths, or which components use this one.
- Don't rewrite comments in code you aren't otherwise changing.
