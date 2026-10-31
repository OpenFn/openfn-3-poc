---
name: loose-ends
description: Review refactoring or tidy-up work in the replica and find everything connected to it that the change missed, then tie those ends off. Use for "loose ends", "/loose-ends", "what did I miss", "is this refactor finished", "check my tidy-up", "find anything else connected", or before committing a branch that renames, moves, replaces or removes a component, prop, pattern or helper.
---

# Tie up loose ends after a refactor

A refactor is finished when the old way is gone everywhere, the new way is
written down where people will look for it, and nothing visible changed by
accident. The diff only shows the files you remembered. This skill finds the
ones you didn't.

## 1. Say what the refactor is

Read the diff against main (`git diff main...` plus `git status` for
untracked files), or the target Lucy names. Write down, in a few lines:

- **The old way**: the name, prop, class list, markup or helper that is going.
  Get the literal strings you could grep for (`text-faint italic py-8`,
  `<p className="… empty`, `isEmpty=`, the old file name).
- **The new way**: what replaces it (`EmptyState`, `fill`, a new prop).
- **The rule behind it**: one sentence, e.g. "every empty list, panel or
  viewer is an `EmptyState`".

If you can't state the rule, ask Lucy before sweeping. Everything below
checks against it.

## 2. Find the old way that's still there

Grep all of `src/` for each literal from step 1, and for the shapes it takes
when written by hand (the same classes in a different order, a near-copy in a
template string, the same copy text). Sort what you find:

- **Same thing, not migrated** → fix it in this branch.
- **Looks the same but means something else** → leave it, and say why in
  the report in one line.
- **Needs a decision** (the new way doesn't quite fit it) → one question
  for Lucy, with a pick.

Then look for things the refactor made dead:

- components, helpers, types or constants no longer imported anywhere
  (`grep -rn "from .*<Name>"`), and their stories and tests;
- props, variants or options no caller passes any more ("no options nobody
  uses", `docs/building.md`);
- exports in `src/index.ts` for things that moved or went;
- `eslint-disable` lines whose reason was the old way, especially
  `-- debt:` ones this change pays off (`grep -rn "debt:" src`).

## 3. Check every place that describes it

The replica writes its rules down in several places. Each one that names
the old way, or should name the new one, is a loose end:

| Place | Look for |
|---|---|
| `docs/building.md` | the primitives table (a row for the new piece, none still pointing at the old way), where a component goes, prop names, type, and the patterns with their example stories |
| `CLAUDE.md` | the rules that apply everywhere and the map of where things are |
| `.claude/rules/*.md` | `pages.md`, `tests.md`, `stories.md`, `mock-data.md`, `comments.md` |
| `STANDARDS.md`, `PRINCIPLES.md` | a pattern or principle whose example is the old code |
| `docs/lightning-differences.md` | a deliberate difference the change adds, removes or alters |
| `.claude/skills/` | skill steps that name a moved file or command |
| code comments | comments next to changed code that still describe the old behaviour |

Fix the wording in the same branch. Keep pattern numbers in STANDARDS.md
unchanged (`.claude/rules/standards.md`).

## 4. Check what it touches around it

- **Stories.** A new primitive has a story per state. Feature stories whose
  component changed still show the state that changed (empty, loading,
  failed). Look at every story of a component whose layout changed, not one.
- **Tests.** Tests that found the old markup by text, role or class still
  find it for the right reason. New behaviour in a primitive is tested in the
  primitive's own test file, and the test fails without it.
- **Lint.** If the old way can come back by accident, say whether a lint
  rule could ban it (`eslint.config.js`, `no-restricted-syntax`). Suggest it;
  don't add one without Lucy.
- **Themes.** A new primitive or variant has its `data-ui` / `data-variant`
  hooks. Grep `src/theme/` for selectors that targeted the old markup.
- **Annotations.** Markup that moved into a primitive kept its
  `data-annotation` on the caller.
- **Seam and tiers.** Nothing new imports `src/mock-data/`, `src/session/`
  or the router, and nothing imports up a tier.
- **Visible change.** Diff every user-facing string in the change. A
  refactor shouldn't change Lightning's wording, headings, column order or
  empty-state copy. If it did, it's either a bug or an entry in
  `docs/lightning-differences.md`. Copy that moved from JSX text into a prop
  counts as kept; this lists only strings removed or added outright:

  ```bash
  d=$(git diff -U0 main -- src ':!*.stories.tsx' ':!*.test.tsx')
  ex(){ grep -oE '"[A-Z][^"]{6,}"|>[A-Z][^<{]{6,}<|`[A-Z][^`]{6,}`' | sed -E 's/^[">`]//; s/["<`]$//' | sort -u; }
  comm -3 <(echo "$d" | grep '^-' | ex) <(echo "$d" | grep '^+' | ex)
  ```

## 5. Prove it

Run, in this order, and report what failed with its output:

```bash
npm run lint
npm test
npm run build
node scripts/design-system-metrics.mjs   # compare with main; numbers should go down
```

For metrics, run the script on main too, in a throwaway worktree
(`git worktree add /tmp/loose-ends-main main`, removed afterwards; never
stash, the stash is shared with other sessions), and give both numbers. If
the branch already has commits from other work, say so: the numbers cover
the whole branch, not only this refactor. Ask before running `npm run test:stories`; it breaks an open
Storybook.

## 6. Hand back

Fix the mechanical loose ends yourself in the working tree and leave them
uncommitted. Then report, short:

- **Tied off**: one line per fix, `file:line`.
- **Left alone on purpose**: one line each, with why.
- **For Lucy**: before asking, grep the project's `status.md` for the
  component and the files involved; a task or finding may already set the
  direction. Then one question at a time, in the form "Decide: X? My pick: Y,
  because Z. If you don't answer, I'll go with Y."
- **Checks**: lint, tests, build, metrics before → after.

Anything bigger than this branch (a second pattern that needs the same
treatment, a design-system gap, a bug you tripped over) goes in the tracker
with the `track` skill as a finding, not into this branch. If the refactor
belongs to one of Lucy's projects, track the task as finished when the
report is clean.

If the change is wide (more than a couple of areas), hand step 2's sweep to
an Explore agent with the literals and the rule from step 1, and check its
list yourself before fixing anything.
