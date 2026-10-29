# Primitives that don't follow the prop-name rule yet

CLAUDE.md's **Prop names** rule: `tone` for meaning, `variant` for loudness,
`size` as `sm | md | lg`. Button follows it. These don't, found by a review in
four batches (primitives; workflow; history, projects, shell, devtools;
admin, auth, credentials, profile, project settings).

## Renames (the values already fit)

- **Alert** `type` → `tone`, `AlertType` → `AlertTone`. 53 call sites in 28
  files. `data-variant` → `data-tone`, with `theme.css` (the Alert
  `data-variant` selectors) and `AdminAuthProvidersPage.test.tsx:135,139`.
  `SandboxSettingsBanner` maps its own `variant` onto it (below).
- **Toast** `"error"` → `"danger"`. About 12 callers through `toast(…,
  "error")`, `useAction.ts:118`, and the Toast stories and tests.
- **IconButton** and **MenuItem** `tone="default"` → no tone. Nothing passes
  `default`.
- **TextLink** `variant="danger"` → `tone="danger"` (1 call site,
  `GithubSyncPanel.tsx:77`, plus a story); `variant` keeps `plain` only.
- **Tabs** `underline` → `line` (it's the default; `tabStyles.ts`,
  `theme.css`, CLAUDE.md's Components table).
- **IconButton** call sites that colour danger by hand
  (`hover:text-danger-500` in `RunDetails.tsx:173`,
  `WorkOrderTableRow.tsx:150`) → `tone="danger"`.

## Needs a decision

- **Pill** has only `color`, and about half its calls use it for meaning
  (`MergeSandboxModal` Changed/Diverged/New/Deleted, `WorkflowsTable` Live,
  `ChannelRequestParts` HTTP status, `RunBadge`, `AdaptorDisplay`
  "Credential connected", `WorkflowEditorPage` Read-only,
  `SnapshotVersionChip`, `AnnotationCard`). Add `tone` and `variant`
  (`subtle | solid`); keep `color` for tags that mean nothing (dataclip types,
  HTTP methods); `color="dark"` is really `variant="solid"`.
- **Run and work-order states** aren't tones: they have more colours than the
  five (crashed is orange, exception grey with a border). `StatePill` maps
  them inside a feature component; move that map into
  `src/theme/runStateColours.ts` beside the others. `ChannelStatePill`'s
  states do fit the tones.
- **Sizes**: Button `xs` (22 call sites, the table row action), Modal
  `xl`/`2xl` (15), Heading `xl` and `eyebrow` (`eyebrow` is a look, so
  `variant`), Spinner `xs`, UserAvatar `xs | sm`. SearchList's `sm | lg` are
  two looks, not sizes.
- **Feature components using look names for other things**:
  `SandboxSettingsBanner` `variant` (local/editable/inherited) and Sidebar
  `variant` (which menu) choose content, not loudness; Sidebar `theme`
  (`primary-theme | sudo-variant`) follows from the menu and can go.
  `RunBadge` `variant="warning"` is meaning (no caller passes it).
  `AIDisclaimerFooter` `muted`.
- **Booleans**: Card `muted`/`dashed`, Modal `bare`, Pill `square`/`mono`.
  The review's view: they switch on independently, so leave them.
- **Hand-picked meaning colours** with no primitive to use: lone status icons
  (`EdgeInspector.tsx:81`, `TriggerInspector.tsx:239`), the unsaved dot
  (`SaveButton.tsx:24`), the Experimental note in `UserMenu.tsx:54-63` (could
  be an Alert), `FilterChip` (a hand-built Pill with `active`).

**Done when** every primitive takes `tone`, `variant` and `size` as the rule
says, and a lint rule rejects `theme=`, `type=` and `color=` for meaning.
