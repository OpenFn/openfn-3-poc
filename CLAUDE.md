# CLAUDE.md

The frontend that replaces Lightning's LiveView UI, decoupled from its
backend. It started as a page-by-page React replica of Lightning; it now
moves towards Brandon's design and the new API (`api/`), page by page as each
is worked on (PRINCIPLES.md "Where the design comes from"). Built with React,
TypeScript, Vite, Tailwind 4.

**No backend.** Pages render from fixtures in `src/mock-data/`; save, delete
and run only change local state. Each page is built so that wiring it to
Lightning touches one wrapper file and nothing else (see The data seam).

## What to read for your task

| You're… | Read |
|---|---|
| Doing anything | [PRINCIPLES.md](./PRINCIPLES.md). It's short: what good looks like |
| Building or changing a page | The page's annotation, `annotations/views/<inventory-id>.md`: what Lightning's page does and says. Then [STANDARDS.md](./STANDARDS.md): the page and its `.replica.tsx` wrapper, pending, failure, lists |
| Building or changing a component | [docs/building.md](./docs/building.md): which primitive to use, where a new one goes, the recurring patterns |
| Choosing or changing a colour, or a theme | [docs/colour.md](./docs/colour.md): the roles, what a theme may change, when to add a role |
| Building a component or page Brandon has designed | His version in [openfn-ia-demo](https://github.com/brandonjackson/openfn-ia-demo) and its story first. Rebuild it by PRINCIPLES.md, never by copying his code |
| Changing or dropping something Lightning does | [docs/lightning-differences.md](./docs/lightning-differences.md): it may already be on purpose; if not, add a line, with why |
| Shaping data | `api/`: the contract with Lightning |

`.claude/rules/` holds the rules for one kind of file (tests, stories, mock
data, comments, lint) and loads by itself when you touch one.

## Checking your work

- Before you say it's done: `npm run lint` (warnings fail too),
  `npm run build` (typechecks) and `npm test`.
- Changed a component or a story: while you work, run only the stories
  you touched (`npm run test:stories -- Button`). Run the full
  `npm run test:stories` once, right before you commit, and under the
  other themes (`STORYBOOK_THEME=dark …`) only if you changed colours.
  It renders every story and runs axe on it. Stop Storybook first.
- The pixel check is a local Chromatic, for big sweeps across many screens
  that should mostly look the same; don't run it for a normal change. It
  screenshots every story before and after and lists only the ones that
  changed, so the reviewer reads its report instead of the diff. A full run
  takes several minutes; `--only <id part>,…` checks just those stories in
  seconds. Build Storybook at main (`git worktree add --detach <dir>
  origin/main`, then `npx storybook build -o <dir>/sb` there) and on your
  branch (`npx storybook build -o <after>`), then
  `npm run pixel-check -- <dir>/sb <after> <name>`. The report and its
  screenshots land in `pixel-check-screenshots/<name>/` (git ignores it);
  serve that folder. `npm run pixel-check:clear` deletes every saved run.
- A lint exception is disabled on its line with a reason after ` -- `;
  `debt:` marks one to fix.
- Once per piece of work, not after each edit: when components are ready,
  the design-system and accessibility reviewers over all of them together;
  when a page is ready, all four reviewers in `.claude/agents/` (React,
  design system, accessibility, architecture) over the whole page. Fix
  what they clearly get right; bring Lucy only the calls that are hers.

## Running it

- `npm run dev`, then open `http://localhost:5173/openfn-3-poc/#/projects`.
  It's a hash router; `/projects` is a 404.
- `npm run storybook` (port 6006).
- `npm run compare:all` compares the replica with a local Lightning. Use
  the `compare-with-lightning` skill.
- `npm run kickstart:sync` regenerates the shared projects from
  `kickstart/exports/`.
- CI fails if the styling counts from `scripts/design-system-metrics.mjs`
  rise.

## Where things are

- `src/App.tsx`: the routes. Each is a Lightning URL, commented with its
  INVENTORY.md id.
- `src/pages/<area>/`: one file per Lightning view, named for its inventory
  id (`history-work-orders` → `HistoryWorkOrdersPage.tsx`). A page moved to
  the API sits in its own folder with a `.query.tsx` beside it (STANDARDS.md
  pattern 11); older pages still have a `.replica.tsx` wrapper.
- `src/components/shell/`: the app shell; `ProjectGate.query.tsx` is the
  parent of every `/projects/:projectId` route (STANDARDS pattern 11).
- `src/components/`: `primitives/`, `domain/`, `shell/`, then one folder per
  area.
- `src/types/`: the hand-written shapes pages take. `src/constants.ts`:
  Lightning's fixed option lists and copy.
- `src/utils/`: every formatter in `format.ts` (add new ones there, not in
  an area folder); `search.ts` (`matchesQuery`), `validate.ts`
  (`isValidEmail`), `useUrlParams`, `useCopy`, and pure domain helpers
  (`adaptors.ts`, `history.ts`, `urls.ts`, `workflowGraph.ts`). Look here
  before writing a helper.
- `src/permissions.ts`: every `can*` flag, mirroring Lightning's policies.
  `src/session/`: the signed-in user.
- `src/mock-data/`: the fake database. `src/theme/`: themes and colour
  tokens.

## Rules that matter everywhere

- **Brandon's look and words, Lightning's behaviour, nobody's code.** What
  each action does comes from Lightning (paths in INVENTORY.md). Headings,
  labels, button text and empty states come from Brandon's design where he
  has the screen, and from Lightning where he doesn't. The markup comes from
  our primitives. Every change to what Lightning does or says goes in
  `docs/lightning-differences.md`, so a comparison run doesn't undo it.
- **Pages take props.** Data, the user and `can*` flags arrive from the
  `.replica.tsx` wrapper. Lint stops pages, components and utils importing
  `src/mock-data/`, `src/session/` or the router.
- **No styling in pages.** Use a primitive; if none fits, extend one. Lint
  bans raw palette colours, hex, arbitrary values (`text-[13px]`) and type
  sizes outside primitives.
- **Icons** are Heroicons classes: `<span className="hero-folder size-5" />`,
  until the sweep to Lucide (PRINCIPLES.md, One way to do each thing).
  Conditional classes use `cn()`.
- **When lint blocks you, find out why.** Never rename, move or re-suffix a
  file to get past it: the rule is telling you the code belongs somewhere
  else. If the rule is wrong, say so.
- **When a rule is missing**, and Brandon's design, Lightning and
  PRINCIPLES.md don't settle it: take the simplest choice that's cheap to
  undo, keep it in one place, and track it as an assumption for Lucy. A
  choice that's expensive to undo is a question for her, not a guess copied
  across ten files.
- Fixes and open questions go in Lucy's project tracker, not in new files
  here.

## The data seam

Only `*.replica.*` wrappers, `*.query.*` files, `*Replica.ts` helpers and `main.tsx` may import
`src/mock-data/`, `src/session/` or the router. There, the user comes from
`useCurrentUser()` (never a fixture import) and permissions from
`usePermissions(project)` / `permissionsFor`, passed down as `can*`
booleans; no inline role checks. Lint can't see inside replicas, so this
one is on you. Any other file that imports them says why on the import: `-- wiring: …` for one that stays (the app shell),
`-- debt: …` for a page not yet split. List them with
`grep -rnE "no-restricted-imports -- (wiring|debt):" src`.
`src/pages/profile/tokens/TokensPage.tsx` and `TokensPage.query.tsx` are the
worked example (STANDARDS.md pattern 11).
