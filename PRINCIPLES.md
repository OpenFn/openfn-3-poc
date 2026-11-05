# Principles

## What good looks like

**Why.** The frontend is being decoupled from Lightning's backend, for
clearer ownership, faster work and better security. Lightning's frontend grew
with several patterns side by side, and people were afraid to change it in
case something else broke. More and more people outside OpenFn will use it,
so it needs solid foundations and a good experience: one product, with
patterns shared across screens. Without defined patterns, building with AI
gets messy, as the collab editor did. If each screen comes out right the
first time, the patterns are working.

**Where the design comes from.** Brandon's design is what we're building
towards ([openfn-ia-demo](https://github.com/brandonjackson/openfn-ia-demo)),
and it wins on looks and words where it differs from Lightning. We take what
he designed, not how he built it: every piece is rebuilt by these principles.
Lightning still tells us what a page does, so the same scenario tests pass on
both. The new API (`api/`) decides the data's shapes; where a page needs
something the API doesn't send, that's a change to the contract, not a
workaround in the page. Every place we change or drop something Lightning
does is listed in
[docs/lightning-differences.md](./docs/lightning-differences.md), with why.

**Existing pages.** Pages built as Lightning replicas move to these
principles when someone works on them, not all at once. Lint and the
ratchet in `scripts/design-system-metrics.mjs` stop new work adding to the
old ways; each count falls to 0 and then becomes a lint rule.

**Tokens.** Anything common comes from tokens, never raw values: colour,
type, spacing, radius. Lint enforces colour and type; the ratchet holds
spacing and radius.

**Colour comes from roles, and is easy to change.** A role is a token named
for a job (`text-muted`, `bg-surface`, `bg-danger`). Components use
roles, never a palette shade (`gray-600`, `red-100`) or a hex. Only
`src/theme/` touches the palette, to give each role its value. A theme
sets role values and never changes the palette, so gray-600 is the same grey
everywhere. One role does one job, so changing how one thing looks is one
edit. The rules are in [docs/colour.md](./docs/colour.md).

**Where things go.** Search first, and say what you found. Something other
design systems have is a primitive. Something OpenFn-specific that two
screens use is domain. A one-off gets its own small file in the area folder,
never written inline in a page.

**Debt.** `debt:` is never used in new work: code that can't pass lint isn't
finished. It only freezes old code when a new rule lands, with a human's yes.

**How we know it works.** The numbers go down. Agents given a new screen get
it right first time. The screens look like one product. The structure is
easy to explain to a developer. And we can change one area (say, how data is
fetched) without breaking another.

Organise first, then improve the look: once pages hold no styling, a better
look is a change to the primitives. How to apply all this is in
[docs/building.md](./docs/building.md).

## Areas

Each area can change without the others changing. Lint stops imports
crossing the lines.

- **Components:** what things look like. Know nothing about data.
- **Pages:** what a screen shows and does. Take props, fetch nothing, and
  don't know what hosts them (LiveView or a React route).
- **Data** (`src/api/`): getting and sending data, fake or real. Knows
  nothing about how it's shown.
- **App shell:** routes, the sidebar, and what hosts the app. The only area
  that changes when the hosting decision is made.

A page is heading towards being one folder, with everything about it inside,
so deleting the folder leaves nothing behind
([Bulletproof React](https://github.com/alan2207/bulletproof-react)). Pages
don't import each other: what two pages share moves to a shared place.

## Components

- One job, one component. When two do the same thing, delete one.
- Name it for its job, never its look or the page it was first used on: a
  name holding a colour, size or page name gets renamed (`RedModal` →
  `ConfirmModal`, `HistoryPill` → `RunStatePill`).
- Compose, don't configure: content through `children` and named slots
  (`title`, `footer`), not boolean props that change what it does.
- A prop that changes the look is one `variant`, not a boolean; `can*`
  permissions and states (`disabled`, `pending`) stay booleans.
- Primitives know nothing about OpenFn: no product wording, permissions
  or sandbox logic.
- `className` on a primitive is layout and sizing only (`flex-1`, `w-full`,
  `min-w-0`), never for how it looks. The list is in src/components/CLAUDE.md.
- The parent owns the space between children. No outer margins.
- A component's stories are its spec: one per state (empty, loading, error,
  disabled, pending, long text).
- A control doesn't change size when its state changes (Copy → Copied, a
  button going pending), so nothing beside it jumps.

## Buttons

A button's look says how important the action is and what it does, nothing
else.

- Two settings: how loud (`primary`, `secondary`, `plain`) and what it means
  (`danger`, `success`).
- One `primary` per page or dialog, as a rule rather than a law. `secondary`
  for the rest, `plain` for minor actions like Dismiss.
- Removing one thing from a list is `secondary` + `danger` with its word
  ("Delete", "Remove"), never a bare icon.
- Inside a tool panel (the editor, the assistant), the main action is dark,
  so it doesn't compete with the page's main action. Not built until the
  editor or assistant needs it.
- Someone else's brand never colours a button. Connecting GitHub is a
  `secondary` button with GitHub's icon.

## Look and behaviour

- Colour means something: red is an error or a destructive action, yellow a
  warning, green success, blue information, orange a crash. A run state
  takes its tone's colour, the same in every place it's drawn. If taking the
  colour away loses nothing, it's grey.
- Text a user typed has a known home. In a one-line slot (table cell,
  breadcrumb, pill, tab, menu item, button) it truncates and shows the whole
  value on hover, through `Td truncate` or `Truncated`, never by hand. In a
  block (heading, detail list, description, toast) it wraps, breaking long
  words and URLs. Every story with user text has a Long variant.

## One way to do each thing

- **Page:** breadcrumb, title, main action on the right, tabs, content.
- **Container:** chosen by the size of the task: a menu to pick, a side
  panel to edit what's selected, a pop-up for one short task, a step-by-step
  pop-up for set-up, a page for anything long. A pop-up never opens another.
- **Step-by-step pop-up:** "Step 1 of 2", keeps its size, Back left, Next
  right.
- **Switch or checkbox:** a switch takes effect now; a checkbox is part of a
  form you submit. The workflow editor's on/off settings stay switches,
  because the editor is one draft saved as a whole.
- **Status:** one badge per kind of status, same words and colours
  everywhere.
- **Row actions:** up to two quiet buttons, the rest in one ••• menu.
- **Confirm:** one dialog that names the thing; its button repeats the
  action ("Remove collaborator"), never "Confirm" or "Yes". Delete goes last
  in the menu, in red. Deleting a project or account means typing its name.
- **Loading:** a placeholder for content, a spinner inside the button for
  actions, one full-screen loader.
- **Lists:** 25 rows a page.
- **Icon button:** always a label and a tooltip.
- **Icons:** heading to Lucide (Brandon's), imported through one file so
  switching library is one change. Until that sweep, Heroicons classes.

## Forms

A form is four blocks: a container (card, pop-up or sign-in card), a `Form`,
a `Field` per question, and the control. A page fills them in and never lays
out labels, errors or buttons itself.

- One order: label, hint, control, error.
- The label row: label, required star and info icon on the left; at most one
  link or badge on the right. Explain a choice in the hint, not an info icon.
- Every control has a name, visible or `aria-label`.
- Radios or checkboxes that answer one question sit under one label as a
  group.
- One look for every control, one red for errors.
- Errors show when you leave a field or press Save, never while typing. The
  browser's own bubbles are off.
- Never disable Save for invalid values. Show the errors on Save and focus
  the first.
- Buttons on the right, main action last. The sign-in card's single button
  runs the full width.
- A search box or the AI chat box isn't a form; its button sits in the box.

## Data and state

- What the server decides, the server decides. The page shows it and
  doesn't re-check it.
- A value the page doesn't recognise shows as "unknown". It never crashes
  the page.
- Each piece of state has one home. What's selected (tab, run, filter)
  lives in the URL.
- Most effects aren't needed. Work things out while rendering; don't copy
  state from one place to another with an effect
  ([React docs](https://react.dev/learn/you-might-not-need-an-effect)).
- One way to fetch, used everywhere. A reply that arrives after you've moved
  on is ignored.
- The server decides who can do what and sends it with the data, with a
  reason when the answer is no. The page shows that answer; it never works
  out a permission from someone's role. The server checks again when the
  action arrives. Until the API sends permissions,
  `src/permissions.ts` stands in for it, and nothing else does.

## How data flows

A page only shows what it's given (props). Fetching and saving happen in
hooks in `src/api/`, one file per kind of data; the page's .query file calls them
and passes the results down. Never in the page itself.

- **Loading.** The .query file calls one hook per kind of data, from
  `src/api/<resource>.ts` (`useTokens()`), and those hooks hold TanStack
  Query. The .query file never calls TanStack Query itself; the page never fetches,
  and never imports `src/api/`.
- **Saving.** After a save, the resource's hook marks the affected queries
  stale, and the page's `on*` promise resolves once they've reloaded.
  Never write a response into the cache.
  Show a change before the server confirms it only where the page already
  does (`useChosenValue`).
- **Waiting and refusals.** While data loads, or when the server
  refuses the whole page, the page gets an optional `status` prop, and
  `AsyncBoundary` shows it. A failed save stays in its form. A failed action
  with no form shows its error where it happened, or in a toast that stays
  until dismissed. A crash shows an error page with "Try again". The API
  code never shows a toast; the page decides where a message goes.
- **The API code.** One `src/api/` folder: `client.ts` talks to
  Lightning (or the fake server in `src/fake-api/`) and turns refusals into
  `ApiError`, and one file per resource holds the API's shape, the mapper to
  page props, the query keys, the queries and the saves. Show the server's
  `detail`; branch on `code`.

How to apply it is in `.claude/rules/api.md`.

## When things go wrong

- An error is never shown as "nothing here". Failed and empty look
  different.
- Every list has an empty state. Every action has pending and error states.
- Errors stay until dismissed and say what to do next. Success messages
  fade.
- Show an action's result where it happened: the row goes, the box appears,
  the error sits in its dialog. A toast only when there's nowhere on screen
  for it: an action that navigates away, or finishes in the background.
- Nothing loses what the user typed.

## Everyone can use it

We meet [WCAG 2.2 level AA](https://www.w3.org/TR/WCAG22/). The story checks
run axe on every story, but axe catches only part of AA, so keyboard and
screen-reader checks are still ours to do. These are the parts we get wrong
most often.

- Contrast 4.5:1 for text, 3:1 for large text and icons. Colour is never the
  only signal.
- A control the user is blocked from (by permission, plan or state) stays
  visible and focusable, and its tooltip says why ("Only owners can delete
  projects"). It's hidden only if this person could never do it. Native
  `disabled` only when there's nothing to explain.
- A result you can't see happen (copied, deleted, saved) shows where you
  acted and is announced (`role="status"`,
  [WCAG 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)).
  Tooltips explain a control; they never report what happened. Copy says
  "Copied" on the button itself.
- Everything works by keyboard. A shortcut does exactly what its button
  does, and never fires while you're typing.
- A dialog keeps focus inside while it's open and gives it back when it
  closes. A menu moves with the arrow keys. Every input has a label.
- General web rules follow Vercel's
  [web interface guidelines](https://github.com/vercel-labs/web-interface-guidelines).
- Where Brandon has no design and these don't settle it: how it behaves
  comes from the [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/patterns/),
  how it looks and reads from [GitHub's Primer](https://primer.style/product/components/).
  Take the idea, never the code.

## Words

- Where Brandon's design has the screen, its words win. Where it doesn't,
  Lightning's do.
- Sentence case on buttons and headings. A button is a verb and a noun and
  says what it does ("Delete project", not "OK"). One word per thing, from a
  shared glossary.

## How we verify

- We test behaviour, not markup. A test passes on old and new Lightning, or
  we know why it doesn't.
- A failing test isn't fixed blind. It might be a difference we meant.
- Every check is proven once by an independent agent: plant the bug it's
  meant to catch and confirm it fails.
- An independent reviewer checks the work, not the one who built it
  (`.claude/agents/`).
- Lint enforces what it can. A rule only written in a doc gets broken.
- The repo only holds code we're proud of. Claude copies what's nearby.

## Conventions

The detail behind the principles above. The ratchet counts each one in
existing code (`node scripts/design-system-metrics.mjs`), so new work can't
add more; at 0 it becomes a lint rule.

- Spacing uses only Tailwind's steps 0, 0.5, 1, 1.5, 2, 3, 4, 6 and 8. 0.5
  and 1.5 are for the small gaps inside controls.
- Corners come in four sizes, one per job: `rounded-md` for controls
  (buttons, inputs), `rounded-lg` for things on the page (cards, tables,
  callouts), `rounded-xl` for things above or framing the page (dialogs, the
  page header), `rounded-full` for pills and avatars.
- No component sets a fixed width or height. Layout decides how much space
  it gets, so making the app responsive later is a change to layout, not to
  every component. Layout components and the app shell may set sizes; icons
  use `size-3` to `size-6`.
- What sits on top (menus, dialogs, tooltips) comes from a few named layers,
  never a `z-` number.
- Classes are joined with `cn()`, never by building a string, so when two
  classes clash the right one wins.
- IDs come from `useId()`, never written by hand, so a component can appear
  twice on one page.
- A list's `key` names the thing, never its position, so deleting or
  reordering a row keeps the right state on the right row.
- Named exports only, so a rename is the same everywhere.
- Imports across folders use `@/`; `./` only within a folder.
- A file over 300 lines gets split.
