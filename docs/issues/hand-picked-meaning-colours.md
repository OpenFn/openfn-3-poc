# Meaning colours picked by hand, with no primitive to use

These say what something means (a warning, a success, unsaved) with a
colour class written in place, so a theme can't restyle them and a page
carries styling of its own. Found by the prop-name review.

- Lone status icons: `EdgeInspector.tsx:81` (`text-warning-600`),
  `TriggerInspector.tsx:238` (`text-success-600`).
- The unsaved dot: `SaveButton.tsx:24` (`bg-danger-500`).
- The Experimental note in `UserMenu.tsx:54-63` (amber, by hand; could be an
  Alert).
- `FilterChip`: a hand-built Pill with `active`.

**Done when** each takes a primitive with a `tone` (an icon or dot primitive,
Alert, Pill), or the reason it can't is written beside it.
