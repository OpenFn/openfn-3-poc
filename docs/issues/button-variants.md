# Buttons styled outside Button

Button's looks are `primary`, `secondary` and `plain`, with `tone`
(src/components/CLAUDE.md, Prop names). Some buttons still draw their own look.

## Built by hand (marked `debt:`)

- `src/components/workflow/EditorHeader.tsx:83`: the workflow name in the
  editor header, bare text that renames on click.
- `src/components/history/LogViewer.tsx:31`: the log-level menu trigger (icon,
  level, chevron) on the dark log background.
- `src/components/workflow/VersionDropdown.tsx:29`: the "latest" / "v3" menu
  trigger, styled to look like a `Pill`.
- `src/components/shell/PickerButton.tsx:35`: the project picker. It's a
  secondary button, except in a sandbox, where it takes the sandbox colour at
  runtime.

`plain` nearly fits the first two: it's text with no background, darkening
on hover. What's left is its padding, which these don't have (and the log one
fades in on hover rather than darkening). Either they become `plain` buttons
and sit a few pixels wider than Lightning's, or `plain` loses its padding.

For the other two: let `Pill` render as a button (or take an `onClick`), and
give `Button` a way to take the sandbox colour from a CSS variable.

## IconButtons recoloured through `className`

IconButton has one look per `variant` and `tone`; these callers change it.

- `Pill.tsx:72`: the remove X takes the pill's text colour.
- `FilterChip.tsx:70`: a round, primary-coloured X.
- `WorkOrderTableRow.tsx:161` and `RunDetails.tsx:35`: retry, primary on hover.
- `WorkOrdersTable.tsx:163`: tilts and turns primary on hover.
- `MiniHistory.tsx:98`: primary while selected.
- `devtools/SettingsMenu.tsx:38`: the round dark settings button (devtools,
  not Lightning).

Each one either becomes an existing look, or the look moves into Button for
everyone.

**Done when** every `debt:` above is gone and no IconButton sets a colour in
`className`.
