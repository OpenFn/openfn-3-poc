---
paths:
  - "src/pages/**"
  - "src/App.tsx"
  - "src/types/**"
---

# Pages

Before adding or changing a page, read STANDARDS.md pattern 11 (page and
wrapper) and the pattern for what you're adding: a mutation (1), a form (2),
a list (3), a confirm (6), feedback (7), permissions (9).
`src/pages/profile/TokensPage.tsx` and `TokensPage.replica.tsx` are the
worked example.

- **One file per Lightning view**, named after its INVENTORY.md id
  (`history-work-orders` → `HistoryWorkOrdersPage.tsx`). Its route in
  `App.tsx` is Lightning's URL, commented with the same id, and points at
  the `.replica.tsx` wrapper.
- **The frame** is `<PageContent header={<Header … />}>` with a `<Centered>`
  body, unless the page needs a different layout.
- **Every new page gets a story and a `renderPage` test.** See
  `.claude/rules/stories.md` and `.claude/rules/tests.md`.
- Put `data-annotation="<id>"` on any sub-panel that has its own inventory
  or shared id, so the annotations panel shows it.
