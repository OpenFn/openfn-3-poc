# CLAUDE.md

A React replica of OpenFn Lightning's UI, built page by page from the
behaviour audit in `annotations/` (copied from OpenFn/lightning; `SOURCE.md`
says which commit). It is becoming the frontend that replaces Lightning's
LiveView UI. React, TypeScript, Vite, Tailwind 4.

**No backend.** Pages render from fixtures in `src/mock-data/`; save, delete
and run only change local state. Each page is built so that wiring it to
Lightning touches one wrapper file and nothing else (see The data seam).

## Read before you build

| Doc | Says |
|---|---|
| [PRINCIPLES.md](./PRINCIPLES.md) | What good looks like |
| [docs/building.md](./docs/building.md) | Which primitive to use, where a new component goes, how to build one, and the recurring patterns |
| [STANDARDS.md](./STANDARDS.md) | How a page behaves: pending, failure, lists, the page and its wrapper |
| [docs/lightning-differences.md](./docs/lightning-differences.md) | Where we differ from Lightning on purpose |

`.claude/rules/` holds the rules for one kind of file (tests, stories, mock
data, comments) and loads when you touch one.

## Commands

- `npm run dev`, `npm run build` (typecheck and build), `npm test` (Vitest)
- `npm run lint`: warnings fail too. An exception is disabled on its line
  with a reason after ` -- `; `debt:` marks one to fix.
- `npm run storybook` (port 6006); `npm run test:stories` renders every
  story and runs axe on it. Stop Storybook first.
- `npm run compare:all` compares the replica with a local Lightning, screen
  by screen. Use the `compare-with-lightning` skill.
- `npm run kickstart:sync` regenerates the shared projects from
  `kickstart/exports/`.
- `node scripts/design-system-metrics.mjs` counts styling outside the
  primitives. The numbers should only go down.

## Where things are

- `src/App.tsx`: the routes. Each is a Lightning URL, commented with its
  INVENTORY.md id.
- `src/pages/<area>/`: one file per Lightning view, named for its inventory
  id (`history-work-orders` → `HistoryWorkOrdersPage.tsx`), with a
  `.replica.tsx` wrapper beside it.
- `src/components/`: `primitives/`, `domain/`, `shell/`, then one folder per
  area.
- `src/types/`: the hand-written shapes pages take. `src/constants.ts`:
  Lightning's fixed option lists and copy. `src/utils/`: formatters
  (`format.ts`) and shared hooks.
- `src/permissions.ts`: every `can*` flag, mirroring Lightning's policies.
  `src/session/`: the signed-in user.
- `src/mock-data/`: the fake database. `src/theme/`: themes and colour
  tokens.

## Rules that matter everywhere

- **Copy Lightning's behaviour and words, not its code.** Headings, labels,
  button text, empty states, columns and what each action does come from
  Lightning (paths in INVENTORY.md). The markup comes from our primitives.
- **Pages take props.** Data, the user and `can*` flags arrive from the
  `.replica.tsx` wrapper. Lint stops pages, components and utils importing
  `src/mock-data/`, `src/session/` or the router.
- **No styling in pages.** Use a primitive; if none fits, extend one. Lint
  bans raw palette colours, hex, arbitrary values (`text-[13px]`) and type
  sizes outside primitives.
- **Icons** are Heroicons classes: `<span className="hero-folder h-5 w-5" />`.
  No icon packages. Conditional classes use `cn()`.
- Fixes and open questions go in Lucy's project tracker, not in new files
  here.

## The data seam

Only `*.replica.*` wrappers, `*Replica.ts` helpers and `main.tsx` may import
`src/mock-data/`, `src/session/` or the router. Any other file that does
says why on the import: `-- wiring: …` for one that stays (the app shell),
`-- debt: …` for a page not yet split. List them with
`grep -rnE "no-restricted-imports -- (wiring|debt):" src`.
`src/pages/profile/TokensPage.tsx` and `TokensPage.replica.tsx` are the
worked example (STANDARDS.md pattern 11).
