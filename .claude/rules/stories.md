---
paths:
  - "src/**/*.stories.tsx"
  - "src/stories/**"
  - ".storybook/**"
---

# Stories

Every component and every page has a `.stories.tsx` next to it.

- **New component** → a story with a default and each variant worth seeing.
- **Changed props** → update the story args.
- **Deleted component** → delete its story.
- **Router-dependent components** → `withRouter` / `withRouterAt` from
  `src/stories/decorators.tsx`.
- **Wrappers** (a gray page background, a right-hand side panel, a white
  card, a diagram canvas) → `withGrayPanel`, `withSidePanel`,
  `withWhitePanel`, `withCanvas` from the same file, not inline divs.
- **A page's story** takes plain props, with `withRouter`,
  `withCanvas("h-screen")` and `layout: "fullscreen"`. `PageContent` fills
  its parent, so without a height its body is clipped.
- Stories use fixtures from `src/mock-data/`, and every story is signed in
  as `session.user` (`.storybook/preview.tsx`).
- Stories are linted for colour classes like the rest of `src/`, but hex is
  allowed there because it is data (sandbox colours, chart values).

`npm run build-storybook` checks that stories compile. CI runs it on every PR.
