---
paths:
  - "src/components/**/*.tsx"
  - "src/pages/**/*.tsx"
  - "src/theme/**"
  - "eslint.config.js"
---

# Type

Text gets its look from a primitive, never from size classes written by hand.
Sizes alone don't say what text is for, so hand-written ones drift: the audit
found 44 combinations of size, weight and spacing.

## Headings are `Heading`, everything else is `Text`

- **`Heading`** for anything that titles what follows it. `as` is its place
  in the outline (`h1`–`h6`), `size` is its look. Pick the level for the
  outline, never for the size. The small capitals above a section are
  `Heading size="xs"`, the smallest heading.
- **`Text`** for every other piece of text. Its `variant` is a named style,
  a role at a size:

| `variant` | Looks like | For |
|---|---|---|
| `body-md` | 14px | Copy. The default |
| `body-sm` | 12px | Secondary notes: sizes, times, "Click to view" |
| `label-md` | 14px medium | The name of a value or a field |
| `label-sm` | 12px medium | A small name beside or above a value |
| `code-md` | 14px mono | An id or path in 14px copy |
| `code-sm` | 12px mono | Hashes, byte sizes, log lines |
| `stat-lg` | 30px bold | The number a metric card is about |
| `stat-md` | 24px semibold | The total in the middle of a chart |
| `stat-sm` | 18px | A count that stands alone in a table cell |

`variant` is the one prop: it picks which of `Text`'s looks, as Prop names
(`src/components/CLAUDE.md`) uses it on every component.

## How to use them

- **Colour is a class, not a style:** `text-muted`, `text-faint` and the rest
  of `src/theme/tokens.css`.
- **Emphasis inside a sentence keeps the sentence's size.** Use `font-medium`,
  `italic` or `<code>`, not a `Text` to bold one word.
- **A block of copy is one `Text`:** `<Text as="div" className="space-y-3">`
  around its paragraphs, not one on each.
- **Primitives own the type of their parts.** A table cell, field hint, button,
  pill or menu item sets its own; callers don't restyle it. When a primitive
  needs a smaller form, it takes a prop: `DetailList size="sm"` for dense
  lists such as HTTP headers, not `className="text-xs"`.
- **One size per piece of text.** Nothing grows with the viewport or the
  panel width (`@md:text-base`).
- **A new style is added to `Text`,** with its row in this table and its
  story, only when a role and size in use has no style yet.

## Enforced

ESLint (`typeRules` in `eslint.config.js`) bans `text-xs` to `text-9xl`,
`leading-*` and `tracking-*` in `src/pages/` and every folder of
`src/components/` but `primitives/`. A control that owns its type, like
`FilterChip`, disables the rule on its line with the reason; a line still to
move says `debt:`.
