# Design system principles

General web and accessibility rules are in Vercel's
[web interface guidelines](https://github.com/vercel-labs/web-interface-guidelines).
Where they clash with Lightning's wording (Title Case buttons), Lightning wins.
The rules below are ours.

## Components

- One job, one component. When two do the same thing, delete one.
- Name it for what it does, so people reach for the right one.
- Compose, don't configure. Pass content through `children` and named slots
  (`title`, `footer`), not boolean props. Use compound parts only where
  callers repeat or reorder the pieces (`Table`, `Menu`).
- Primitives know nothing about Lightning: no product wording, permissions or
  sandbox logic. Domain components wrap them and add the meaning.
- `className` on a primitive is only for placement (`flex-1`, `w-full`,
  `shrink-0`, `min-w-0`, grid placement), never for how it looks.
- Never work around a primitive. If it can't do the job, extend it.
- The parent owns the space between children. No outer margins.
- A component's stories are its spec: one per state it can be in (empty,
  loading, error, disabled, pending, long text).

## Look

- Tokens only: spacing, radius, type and colour come from the scale. No raw
  palette, hex or `-[…]`.
- Colour by meaning. Status colours are for messages, run colours for run
  states, `tone="danger"` for destructive actions.
- Match Lightning's words and behaviour exactly. Where its styling is
  inconsistent, pick one treatment and list it in
  [docs/lightning-differences.md](./docs/lightning-differences.md).
- Contrast: 4.5:1 for text, 3:1 for large text and icons. Colour is never the
  only signal.

## Behaviour

- A control that can't be used right now stays focusable and says why.
- Design for the longest real value, not the fixture. Long names wrap or
  truncate; empty ones don't break the layout.
- Every list has an empty state. Every action has pending and error states.
- Components take data and actions as props. Only `.replica.tsx` touches data.

## One way to do each thing

- **Page:** breadcrumb, title, main action on the right, tabs, then content.
- **Field:** label, hint, control, error. Every control has a disabled and an
  error look. See Forms below.
- **Switch or checkbox:** a switch takes effect now; a checkbox is part of a
  form you submit.
- **Status:** one badge per kind of status, with the same words and colours
  wherever it shows.
- **Row actions:** up to two quiet buttons, everything else in a ••• menu.
- **Confirm:** one dialog that names the thing, with a button that repeats the
  action ("Remove collaborator", not "Confirm"). Delete goes last in the •••
  menu, in red.
- **Loading:** skeletons for content, a spinner inside the button for
  actions, one full-screen loader.
- **Icon button:** always a label and a tooltip.

## Forms

A form is built from four blocks, each with one job: a container (a card,
a pop-up or the sign-in card), a `Form`, a `Field` for each question, and
the control inside it. A page fills them in and never lays out labels,
errors or buttons itself.

- **One order:** label, hint, control, error. The hint sits close under its
  label; the error sits under the control.
- **The label row:** the label, the required star and an info icon on the
  left; at most one link that acts on the field, or a badge, on the right.
  Explain a choice people need before choosing in the hint, not an info icon.
- **Every control has a name:** a visible label, or `aria-label` where there's
  no room for one. A control without fails in development.
- **A set of radios or checkboxes** sits under one label as a group.
  Disabling the group disables every control in it.
- **One look for every control:** one border colour, filled or empty; the same
  focus outline as everything else; grey outline info icons.
- **One red for errors, from one place.** The border, the typed text and the
  message turn the same red. Keep error text short.
- **Our errors only.** The browser's own required-field bubbles are off.
  Errors show when you leave a field or press Save, never while typing.
- **Never disable Save for invalid values.** Show the errors on Save, then
  move focus to the first one.
- **Buttons are placed by the container:** on the right, main action last, on
  pages and in pop-ups alike. The sign-in card is the one exception: its single
  action runs the full width.

## Where we're heading

These change what Lightning does or says, so they wait until a page is
deliberately redesigned, and each change is listed in
[docs/lightning-differences.md](./docs/lightning-differences.md).

- Choose the container by the size of the task: a menu to pick, a side panel
  to edit what's selected, a pop-up for one short task, a step-by-step pop-up
  for set-up, a full page for anything long. A pop-up never opens another.
- Save by kind of control: switches save instantly and offer Undo, forms use
  Save and Cancel together, the editor shows "Unsaved changes" or "Saved".
- Messages in one place. Success fades; errors stay until dismissed and say
  what to do next.
- Undo for anything reversible. Type the name to delete a project or account.
- Step-by-step pop-ups show "Step 1 of 2", stay the same size, Back on the
  left, Next on the right.
- Lists paginate from 25 rows.
- One "search everything" menu on Ctrl/Cmd+K, and a project switcher on every
  page.
- Sentence case. Buttons are a verb and a noun ("Create credential"). One
  word for each thing, from a shared glossary.
- One primary action per screen.

## Anti-patterns

- A boolean prop that changes what a component does
- A styled raw `<button>`, `<input>` or `<table>` in a page
- A one-off component beside a primitive that nearly fits
- `disabled` on a control that has a reason to explain
- Status colours on run states, or run colours on messages
