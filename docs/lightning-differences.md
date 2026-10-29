# Where the replica differs from Lightning on purpose

The replica copies what Lightning does and says (CLAUDE.md, Matching
Lightning). When it looks or behaves differently on purpose, the difference is
listed here, so a comparison run doesn't "fix" it back. Each entry says what
Lightning does, where, and why the replica differs.

Wording and behaviour stay Lightning's. Most entries are where Lightning styles
the same thing two ways and the replica picks one.

Add an entry in the PR that makes the difference; delete it if the replica
goes back to Lightning's way.

## Buttons

- **One focus ring colour.** Lightning's danger and success buttons draw a
  red or green focus outline (`new_inputs.ex:244,249`); the replica uses the
  focus colour on every button, so focus always looks the same.
- **A pending button's spinner replaces its icon.** Lightning's Run button
  swaps its play icon for a spinning `hero-arrow-path`
  (`collaborative-editor/components/NewRunButton.tsx:62`); the replica uses
  Button's own spinner, as every pending button does. The "Processing" label
  is Lightning's.
- **Icons in medium buttons are 16px.** Lightning draws 20px in two places
  (Generate New Token in the empty tokens list, Add Additional Collaborator)
  and 16px in the rest.
- **Icon buttons share Button's heights**: a square of 28, 32, 36 or
  40px, so an icon lines up with the text buttons beside it. Lightning sizes
  each one by hand, from a bare 20px modal X to 28px editor buttons.
- **The AI chat's send button is a primary button, paler when disabled.**
  Lightning turns it grey (`collaborative-editor/components/ChatInput.tsx:368`).
- **The cancel-run X is grey, darker on hover**. Lightning turns it
  red on hover (`run_live/workorder_component.ex:262,422`). Red is kept for
  what can't be undone, like deleting a token
  (`tokens_live/index.html.heex:104`); a cancelled run can be retried.
- **Icon buttons have no hover background.** Hover darkens the icon only, so
  it looks the same on white and grey surfaces. Some Lightning icon buttons
  add a grey square on hover, others don't.

## Tags

- **A timed-out channel request is a warning (yellow).** Lightning draws the
  Timeout state pill orange (`channel_state_pill`); the replica puts channel
  states on Pill's tones, which have no orange.
