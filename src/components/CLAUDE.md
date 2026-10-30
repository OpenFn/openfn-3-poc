# Building components

Rules for adding or changing anything in `src/components/`. The root
CLAUDE.md has the primitives table (which component to reach for) and the
data seam; this file is how the components themselves are built.

## Themes and libraries

Primitives expose their look to the themes through `data-ui` (and
`data-variant` for the variant, `data-tone` for the tone, `data-size` for
the size). Theme CSS targets those hooks, never
element selectors or utility classes, so a new primitive or variant needs its
hook, and the GDS theme is worth a look after styling changes.

Dialogs, menus, popovers and selects sit on Headless UI (`@headlessui/react`), which
handles focus, keyboard and positioning. `Tooltip` sits on Floating UI
(`@floating-ui/react`), the library under Headless UI. Don't hand-roll `fixed inset-0`
overlays, click-outside handlers or `absolute` dropdown panels.

## Primitives own their behaviour

Callers pass props; they never patch around a primitive.

- **Fix the primitive, not the caller.** If a caller needs a workaround (a
  wrapper span, `title=""`, an offset tweak), the fix belongs in the
  primitive. A disabled control's tooltip is `Tooltip`'s `disabled` prop,
  not a span in five components. A close X with no tooltip is `CloseButton`,
  not `title=""` on seven buttons.
- **Off means off.** A primitive with nothing to show (`Tooltip` with no
  `content`) renders its child unchanged: no listeners, no effect on
  anything around it. It also keeps the same element tree, so toggling it
  never remounts the child and loses focus.
- **One library per job.** Overlays share one stack (Headless UI and Floating
  UI) so focus, Escape and stacking agree. If a primitive needs workarounds
  against its library's internals, swap the library, as `Tooltip` did with
  Radix.
- **Anchor to what it describes.** A tooltip on a full-width row floats far
  from its icon; put it on the icon.
- **No options nobody uses.** Add a prop when a caller needs it, not before.
- **Every rule has a test that fails without it.** Behaviour in a primitive
  is shared by every page, so test it in the primitive's own test file, not
  through each caller.

## Prop names

Three props say how a primitive looks, and each answers one question, with
the same name on every component:

| Prop | Answers | Values |
|---|---|---|
| `tone` | What does it mean? | `neutral`, `info`, `success`, `warning`, `danger`, one list shared by every component; each takes the part it supports. Leave it off for the component's usual colour |
| `variant` | How loud is it, or which of its looks? | The component's own list, loudest first: Button `primary`, `secondary`, `plain`; Tabs `line`, `pill`; SearchList `palette`, `field`; Text's type styles, `body-md` to `code-sm` (`.claude/rules/type.md`) |
| `size` | How big is it? | `xs`, `sm`, `md`, `lg`, `xl`. Each component takes the steps it needs. Button and IconButton share one height per step, so they line up side by side; other components' steps are their own for now |

- Meaning only goes in `tone`. `danger` is never a `variant`, so
  `<Button tone="danger">` and `<Pill tone="danger">`.
- `variant` never carries meaning, and `tone` never carries loudness.
- No other names for these: not `theme`, `type`, `color`, `appearance` or
  `kind`. `color` stays only on Pill's tag colours, which mean nothing.
  Lint rejects them on our components (`eslint.config.js`, `propNames`).
- Modal's sizes are widths, a separate scale from control heights.
- A prop that picks content rather than a look takes a content name:
  Sidebar's `menu`, SandboxSettingsBanner's `scope`.

## Tooltips

Every tooltip is a `Tooltip`, never a browser `title`.

- An icon-only control always shows its name as a tooltip (`IconButton`'s
  `label` is its tooltip). The close X is the exception (`CloseButton`).
- A text button gets a tooltip only when it adds something: a keyboard
  shortcut, or why it's disabled. Never its own text again.
- A disabled control says why, when there's a reason to give. A shortcut
  does nothing on a disabled control, so it isn't shown there.
- The text is the name, then any shortcut in brackets: "Close IDE (Esc)".

## Feature components

`src/components/<area>/` holds one panel or section of a page
(`WorkOrdersTable`, `WebhookSecurityPanel`). They're often used once, and
that's fine: they're the unit we wire to the backend and annotate. They
compose primitives and don't carry their own button, input, modal or menu
styling.

- **Need something that doesn't exist yet?** If it's general, add or extend a
  primitive. If it's specific to an area, make a feature component. Either
  way, add its story first.
- When a pattern repeats across three or more feature components, it's a
  primitive waiting to happen. Promote it.
- Before adding a variant to a feature component, check whether a primitive
  already covers it. Prefer a slightly different look over a second
  implementation.
