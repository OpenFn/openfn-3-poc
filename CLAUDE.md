# CLAUDE.md

## Project overview

A clean React replica of OpenFn Lightning's UI, built page for page against
the behaviour audit in OpenFn/lightning (`annotations/INVENTORY.md`, branch
`claude/tender-mendel-0pejfc`). React + TypeScript, Vite 8, Tailwind CSS 4.

**No backend logic.** Every page renders from static fixtures in
`src/mock-data/`. Interactions that would hit the server (save, delete,
invite, run) only change local React state, or do nothing. The next step is
cross-referencing each page with its annotation and wiring it to the backend,
so keep pages easy to wire: data comes in through mock-data helpers, not
inline literals scattered through the markup. See **The data seam** below.

**How pages behave** (pending, failure, server-driven lists, loading states)
is in [STANDARDS.md](./STANDARDS.md). Read it before adding a mutation or a
list page; `src/pages/profile/TokensPage.tsx` (props only) and its
`TokensPage.replica.tsx` wrapper (fake data, URL, toasts) are the worked
example. A page that will move to Lightning follows pattern 11, page and
wrapper.

## Commands

- `npm run dev` — start dev server
- `npm run build` — typecheck and build
- `npm test` — run the unit tests (Vitest)
- `npm run lint` — run ESLint. CI runs it, and warnings fail too. The
  colour, arbitrary-value and raw-control rules below are lint errors. An
  exception is disabled on its line with a reason after ` -- `; a reason
  starting `debt:` is one to fix (`grep -rn "debt:" src`).
- `npm run storybook` — start Storybook on port 6006
- `npm run build-storybook` — build Storybook static site
- `npm run compare:all` — set up a local Lightning and compare it with the
  replica, screen by screen. See **Comparing with Lightning** below.
- `npm run kickstart:sync` — regenerate the shared projects from
  `kickstart/exports/` (fixtures here, Kickstart scenario for Lightning).
- `node scripts/design-system-metrics.mjs` — count styling outside the
  primitives (className lists, distinct Tailwind tokens, raw elements). Run it
  before and after design-system work; the numbers should go down.

## Layout

- `src/App.tsx` — the route table. Every route is a Lightning URL
  (`lib/lightning_web/router.ex`), commented with its INVENTORY.md id.
- `src/pages/<area>/` — one file per Lightning view. Named after the
  inventory id (e.g. `history-work-orders` → `HistoryWorkOrdersPage.tsx`).
  A view that follows pattern 11 (page and wrapper) adds a
  `<Name>.replica.tsx` wrapper beside it, and `App.tsx` routes to that.
- `src/components/` — the component library: primitives in `primitives/`,
  Lightning pieces shared by two or more areas in `domain/`, app chrome
  (sidebar, project picker, user menu) in `shell/`, feature components in
  area subfolders. See **Components** below.
- `src/types/` — the contract shapes pages and components take
  (`WorkOrderRow`, `CurrentProject`, …), written by hand, one file per area.
  Types only. Lint stops them importing the replica's models.
- `src/constants.ts` — Lightning's fixed vocabulary: option lists, labels and
  copy hard-coded in its source (`historyStatuses`, `collaboratorRoles`, …).
- `src/utils/format.ts` — every date, duration, size, id and name formatter
  (`capitalize`, `shortUuid`, `fullName`, …). Add new ones here, not in an area folder.
  Other shared helpers sit beside it: `search.ts` (`matchesQuery`),
  `validate.ts` (`isValidEmail`), `useUrlParams.ts`, `useCopy.ts`, and pure
  domain helpers per area (`adaptors.ts`, `history.ts`, `urls.ts`,
  `workflowGraph.ts`).
- `src/permissions.ts` — `permissionsFor(project, user)`: every `can*` flag,
  mirroring Lightning's policies (`lib/lightning/policies/`).
- `src/session/` — the signed-in user and instance details:
  `useCurrentUser()`, `useInstanceInfo()`, `usePermissions(project)`.
- `src/mock-data/` — the fake database: fixtures modelled on Lightning's demo
  seed (`lib/lightning/setup_utils.ex`) and the queries over them (`findProject`,
  `workOrdersIn`, …), with its own record types in `models/`. Rules in
  `.claude/rules/mock-data.md`.
- `src/theme/` — themes, chosen from the settings button (bottom right).
  Lightning v2 is the default.
- `annotations/` — a copy of the behaviour audit from OpenFn/lightning
  (`annotations/SOURCE.md` says which commit). The annotations panel, opened
  from the settings button, shows the annotation for the element under the
  mouse: the nearest `data-annotation="<id>"`, else the page's view id
  (`src/annotations/viewIds.ts`). Put `data-annotation` on any sub-panel that
  has its own inventory or shared id. To update, replace the folder with the
  branch's current `annotations/` and update SOURCE.md.
- `docs/lightning-differences.md` — where the replica looks or behaves
  differently from Lightning on purpose.
- Known fixes and open questions live in Lucy's project tracker, not the
  repo. Don't add files for them here.

## Matching Lightning

This repo is becoming the React frontend that replaces Lightning's
LiveView UI, so Lightning is the source of truth for **what** a page does,
not **how** it's built.

- **Copy behaviour and content exactly.** Find the view in OpenFn/lightning
  (paths are in INVENTORY.md) and match its headings, labels, button text,
  empty states, column names and order, and what each action does.
- **Don't copy its implementation.** Lightning mixes LiveView components,
  the collaborative editor's React components and a half-started new design
  system. Don't port those splits. Build every page from the primitives
  below, and when two Lightning screens style the same thing differently,
  pick one treatment in the primitive rather than copying both. Where the replica
  looks or behaves differently on purpose, list it in
  [docs/lightning-differences.md](./docs/lightning-differences.md).
- Colours are named for what they're for: `text-strong`, `text-body`,
  `text-muted`, `text-faint`, `bg-surface`, `bg-subtle`, `border-subtle` and
  the rest in `src/theme/tokens.css`. Brand is `primary-*` (indigo; don't
  write `indigo-*`); status is `danger`, `success`, `warning` and `info`, at
  the same shades as red, green, yellow and blue. Raw palette classes and hex
  are lint errors outside the few files that are about colour (tags in Pill,
  run states in `src/theme/runStateColours.ts`, chart palettes). Stories are
  not linted for colour.
- Icons are Heroicons as CSS classes: `<span className="hero-folder h-5 w-5" />`,
  with `-solid`, `-mini` and `-micro` suffixes. No icon packages.
- Use `cn()` from `src/utils/cn.ts` for conditional classes.
- Every page is `<PageContent header={<Header … />}>` with a `<Centered>`
  body, unless the page needs a different layout.

### Comparing with Lightning

When asked to "compare with Lightning" (or to check a page against it, or to
load a project export), follow the `compare-with-lightning` skill
(`.claude/skills/compare-with-lightning/SKILL.md`). The short version:
`npm run compare:all` sets up a local Lightning `main` on the demo seed plus
the shared projects from `kickstart/exports/`, starts the replica, and writes
side-by-side screenshots and wording reports to `compare-out/`. Read the
reports, open every shot, then fix wording and behaviour differences. Ignore
visual drift and the richer fixture data. Add new screens to the specs in
`scripts/compare-lightning/specs/` so the next run covers them.

## Components

Components sit in tiers (primitives, `domain/`, the shell, one folder per
area) with pages on top, and imports only go down; ESLint enforces it.
Where a new component goes, and the patterns for recurring tasks, are in
`.claude/rules/components.md`.

**Primitives** (`src/components/primitives/`) are small, general and used
everywhere. Reach for these first:

| Need | Use |
|---|---|
| An action | `Button` (`size="xs" variant="secondary"` for table row actions) |
| A form's values, dirty state and errors | `useForm` from `utils/useForm.ts` (never disable submit for invalid values) |
| A request in flight | `useAction` from `utils/useAction.ts` (`useActions` for one per row); `Spinner` for anything loading |
| A switch or select saved on every change | `useChosenValue` from `utils/useChosenValue.ts` |
| An icon-only action | `IconButton` (always give it a `label`) |
| The X that closes a modal, toast or panel | `CloseButton` |
| A button that opens a menu | `ButtonMenu`; `SplitButton` when the button also has its own action |
| A form control | `TextInput`, `PasswordInput`, `TextArea`, `Select`, `Checkbox`, `Radio` from `Inputs`; wrap anything else in `Field` with `controlClasses()` and `data-ui="field"` (tests pick from a `Select` with `pickOption` in `src/test/select.ts`) |
| A name that becomes a URL-safe slug | `NameField` |
| A dialog | `Modal` |
| A dialog around one form | `FormModal` |
| Confirming one action | `ConfirmModal` |
| A list of actions or choices | `Menu` with `MenuItem`, `MenuSection`, `MenuDivider` |
| A floating panel (filters, details) | `Popover` |
| A searchable list you pick from with the keyboard | `SearchList` |
| Show / hide a section | `Disclosure` |
| Switching views | `Tabs` |
| Picking one value from a few | `SegmentedControl` |
| Searching or filtering a list | `SearchInput` |
| A status chip, badge or tag | `Pill` |
| Any bordered panel, tile or card | `Card` |
| A heading inside a page | `Heading` |
| Any other text (copy, notes, labels, ids) | `Text`, with a `variant` from `.claude/rules/type.md` |
| Labelled values | `DetailList` + `DetailItem` |
| A timestamp | `DateTime` |
| A tooltip | `Tooltip`; `InfoTooltip` for the faded info icon next to a label |
| A short work order, run or dataclip id | `UuidChip` |
| An on/off switch | `Toggle` |
| An inline link | `TextLink` |
| Read-only code, a log or a dataclip | `CodeViewer` |
| A file upload or drop area | `FileDropZone` |
| Tabular data | `Table` with `Tr`, `Th`, `Td`, `EmptyState` (a clickable `Tr` ignores clicks on links and buttons inside it, so no `stopPropagation`) |
| Sorting and filtering a table in the browser | `useTableSort` from `utils/useTableSort.ts` |
| "Projects (3)" above a table, with its buttons | `TableTitle` |
| A status message | `Alert` |
| Page frame | `PageContent`, `Header`, `Centered`, `Breadcrumbs` |

Props are documented on each component (its comments and types) and shown in
its stories, so they stay in step with the code. Read the component before
using it.

How components are built (theme hooks, the libraries under them, prop names,
tooltips, when to make a primitive) is in
[src/components/CLAUDE.md](./src/components/CLAUDE.md), which loads when you
work in that folder.

**Feature components** (`src/components/<area>/`) are one panel or section
of a page (`WorkOrdersTable`, `WebhookSecurityPanel`), built from primitives.

- **Pages compose components** and take everything as props. State, route
  params and mock-data queries live in the page's `.replica.tsx` wrapper. No
  styled raw `<button>`, `<input>` or `<table>` in pages.
- **Components, pages and utils never import `src/mock-data/`, `src/session/`
  or the router** (ESLint enforces it; `*.replica.*` files, `*Replica.ts`
  helpers, tests and stories are exempt). They take records and `can*`
  booleans as props. See **The data seam** below.
- Use Tailwind's scale, not arbitrary values (`text-[13px]`, `max-w-[15rem]`),
  except for real geometry such as the workflow diagram.
- Button labels follow Lightning's own wording, not a house style.

## The data seam

Wiring the backend should only touch the files that import `src/mock-data/`,
`src/session/` or the router: `*.replica.*` wrappers, `*Replica.ts` helpers,
`main.tsx` (the session) and a short, labelled list of exceptions. ESLint
enforces this on `src/components/`, `src/pages/` and `src/utils/`.

- **Data** comes in through the replica. `XPage.replica.tsx` queries mock-data
  and passes records to `XPage.tsx` as props. When a component needs a join
  Lightning preloads (a work order's runs, a project's owner), give the record
  type the joined field (`HistoryWorkOrder`, `AdminProjectRow`) and build it
  in the mock-data query. Wiring that page means writing a Lightning wrapper;
  the page file doesn't change.
- **The current user** is read in the replica with `useCurrentUser()`, never a
  fixture import, and passed down.
- **Permissions** come from `permissionsFor(project, user)` (or
  `usePermissions(project)`) in the replica, passed down as booleans, the way
  Lightning's views assign `can_*` at mount. No inline role checks.
- **Exceptions** are files that still cross the seam. Each import says why:
  `// eslint-disable-next-line no-restricted-imports -- wiring: …` for one that
  stays (the app shell, the adaptor registry), `-- debt: …` for a page not yet
  split into page and replica.
  `grep -rnE "no-restricted-imports -- (wiring|debt):" src` lists them. Don't add one without a
  reason the next person can act on.

## Rules by area

The rules for one kind of file are in `.claude/rules/`. Each file loads only
when you work on a file matching its `paths:`. Read the one that applies
before writing code it covers.

| File | Covers |
|---|---|
| `pages.md` | `src/pages/`, `App.tsx`, `src/types/`: which STANDARDS.md patterns to read, naming, the frame, stories and tests |
| `tests.md` | `*.test.ts(x)`, `src/test/`: where each behaviour is tested, how to write and name a test |
| `stories.md` | `*.stories.tsx`, `.storybook/`: what each component's stories show |
| `mock-data.md` | `src/mock-data/`, `kickstart/`: fixtures, queries, models, generated data |
| `standards.md` | `STANDARDS.md`: pattern numbers never change |
| `comments.md` | all source: when a comment earns its place, and what it never says |
| `type.md` | components, pages, themes: `Heading` and `Text`, the named styles, what lint bans |
| `components.md` | `src/components/`, `src/pages/`: the tiers, where a new component goes, and the patterns for recurring tasks |

A new rule goes in the file for the files it governs, not here. If ESLint or
a test enforces it, the rule names which.
