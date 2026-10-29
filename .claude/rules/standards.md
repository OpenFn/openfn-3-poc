---
paths:
  - "STANDARDS.md"
---

# STANDARDS.md

Pattern numbers are cited across the repo (`grep -rn "pattern [0-9]" .`).

- Never renumber. A new pattern goes at the end; a retired one keeps its
  number and heading, marked retired.
- When a pattern's meaning or scope changes, grep for its number and fix
  each citation in the same commit.
