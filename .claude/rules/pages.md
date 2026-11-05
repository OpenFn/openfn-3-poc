---
paths:
  - "src/pages/**"
  - "src/App.tsx"
  - "src/types/**"
---

# Pages

Before adding or changing a page, read STANDARDS.md pattern 11 (page and
route) and the pattern for what you're adding: 1 for a mutation, 2 for a
form, 3 for a server-driven list, 6 to confirm, 7 for feedback, 9 for
permissions.

- **One file per Lightning view**, named after its INVENTORY.md id, routed
  in `App.tsx` at Lightning's URL through its `.route.tsx` (new pages, in their own folder) or older `.replica.tsx` wrapper.
- **Every new page gets a story and a `renderPage` test.**
- **A list page uses ListPage**, which draws the header, layout, loading,
  failure and empty state. Lint stops a file on ListPage importing Header,
  PageContent, EmptyState or AsyncBoundary. Tests stop a component it
  imports drawing EmptyState, and a new component on the Table primitive
  drawing its own (the old ones are a shrinking list).
- Put `data-annotation="<id>"` on any sub-panel that has its own inventory
  or shared id, so the annotations panel shows it.
