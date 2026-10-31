---
paths:
  - "src/pages/**"
  - "src/App.tsx"
  - "src/types/**"
---

# Pages

Before adding or changing a page, read STANDARDS.md pattern 11 (page and
wrapper) and the pattern for what you're adding: 1 for a mutation, 2 for a
form, 3 for a server-driven list, 6 to confirm, 7 for feedback, 9 for
permissions.

- **One file per Lightning view**, named after its INVENTORY.md id, routed
  in `App.tsx` at Lightning's URL through its `.replica.tsx` wrapper.
- **Every new page gets a story and a `renderPage` test.**
- Put `data-annotation="<id>"` on any sub-panel that has its own inventory
  or shared id, so the annotations panel shows it.
