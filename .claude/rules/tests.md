---
paths:
  - "src/**/*.test.ts"
  - "src/**/*.test.tsx"
  - "src/test/**"
---

# Tests

Vitest with Testing Library in jsdom (`npm test`). A test sits beside the file
it covers: `X.test.tsx` for `X.tsx`, `X.replica.test.tsx` for its wrapper,
`x.test.ts` for a helper.

## Where each promise is tested

Each behaviour has one home. Find it before writing a test.

- **A primitive's behaviour** (`Button` pending, `Tooltip` off means off,
  `Select` keyboard): the primitive's own test. Pages and feature components
  don't test it again through their own markup.
- **What a page draws and asks for**: `XPage.test.tsx`, through
  `renderPage` from `src/test/renderPage.tsx` (STANDARDS.md pattern 11). The
  test feeds props and answers each `on*` with `host.resolve` or
  `host.reject`, so pending, success and failure are each a step you can
  check. Older page tests that call `render` directly move to `renderPage`
  when next touched; `AdminAuthProvidersPage.test.tsx` is the example.
- **What the replica's fake server decides** (an email that is already
  taken, a list it filters): `XPage.replica.test.tsx`. Only the rule the
  replica owns, not what the page already shows.
- **A shared helper** (`useForm`, `useAction`, `format.ts`, a mock-data
  query): its own `.test.ts`, holding every case. A page that uses it keeps
  at most one test that fails if it stops calling it.
- **A rule about the whole source tree** (file layout, the data seam lint):
  `src/source-layout.test.ts` or `src/lint-seam.test.ts`.

## Writing a test

- Find elements the way a user does: `getByRole` with its `name`, then
  `getByLabelText`, then `getByText`. Write Lightning's wording out in full,
  so a reworded label fails the test. Assert a class only when the class is
  the behaviour (`line-through` on a used backup code).
- Use the helpers in `src/test/`: `pickOption` (`select.ts`) to choose from a
  `Select`, `hover` and `tooltipOf` (`tooltip.ts`) for tooltips. Monaco and
  `ResizeObserver` are already stubbed in `setup.ts`; don't stub them again.
- When a behaviour changes, change the test that holds it, and rename it if
  its name stops being true. Add a test only for a promise that didn't exist
  before. A new test with the same setup and action as an existing one
  means you should have edited that one.
- Several inputs to one rule are one table test (`it.each`, or a `for` loop
  inside the test). Different setups, or success against failure, stay
  separate tests.
- A test for a pending state leaves the action unanswered, checks the page,
  then answers it and checks again. Don't fake timers to get there.
- Before deleting or merging a test, name the test that still covers it.
  Break that behaviour in the code and watch the surviving test fail.
- When the same setup appears a third time, move it to a helper at the top
  of the file, or to `src/test/` once two files need it.

## Names

- `describe` is the component or function name. Each `it` says what the user
  sees or does, in plain words: "keeps Save enabled, and pressing it on a
  blank form says what is missing without saving".
- Names and comments cite no ticket numbers, commit hashes or decision ids.
  State the rule itself.
