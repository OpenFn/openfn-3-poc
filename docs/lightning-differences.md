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

- **Pending buttons, and disabled buttons that say why, keep keyboard focus.**
  They're `aria-disabled` and ignore presses, so focus isn't lost when a
  button goes pending and Tab reaches the tooltip's reason. Lightning
  disables them natively (`new_inputs.ex:268-280`, `phx-disable-with`), which
  drops focus and hides the reason from the keyboard. A disabled button with
  no reason is natively disabled in both.
- **Disabled buttons are their enabled colour at half strength.** Lightning
  gives each look its own disabled colours (`new_inputs.ex:232-247`, e.g.
  success turns a mint `bg-green-300`). One rule for every look, and no mint green.
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
- **The AI chat's send button is a primary button, at half strength when disabled.**
  Lightning turns it grey (`collaborative-editor/components/ChatInput.tsx:368`).
- **The cancel-run X is grey, darker on hover**. Lightning turns it
  red on hover (`run_live/workorder_component.ex:262,422`). Red is kept for
  what can't be undone, like deleting a token
  (`tokens_live/index.html.heex:104`); a cancelled run can be retried.
- **Icon buttons have no hover background.** Hover darkens the icon only, so
  it looks the same on white and grey surfaces. Some Lightning icon buttons
  add a grey square on hover, others don't.

## Page header

- **A page inside a project names itself under the bar.** Lightning's bar
  holds the breadcrumb and, on some pages, the main button, and the page name
  is only the last crumb (`LayoutComponents.header`). The replica keeps the
  bar with the breadcrumb, and adds a row under it with the page title, its
  count and the main button or search: "Workflows (3)" with "Create new
  workflow". Lightning put those in the body's `table_title` on Workflows,
  Sandboxes and Channels, so every page now names itself in one place.
- **Top-level pages keep their title in the bar, and their main button moves
  up beside it.** Lightning puts "Create project" and "Create collection"
  under a second "Projects (3)" / "Collections (3)" title in the body
  (`dashboard_live/user_projects_section.ex:74`, `collection_live/index.ex:99`);
  the replica shows the count in the bar title and drops the repeat.
- **History's Work Orders / Channel Logs tabs sit beside its title.**
  Lightning puts them in the bar (`run_live/index.html.heex:22`).
- **A detail page's short id is in its title, as plain text.** Lightning
  ends the breadcrumb with "Run" and a light short id (or a mono one for a
  channel request); the replica's breadcrumb ends with "Run" and the title
  row reads "Run 5e9a1c2b". How a short id looks is still open (G155). A
  run's snapshot chip ("latest") sits beside the workflow's name in the
  run's details, since it names that workflow's version; Lightning puts it
  after the id in the breadcrumb.
- **A workflow's Health page names the workflow in the header**, with the
  range picker beside it; Lightning puts both at the top of the page body.
- **A `>` follows the project picker in the breadcrumb**, the workflow
  editor's included, and a project page's breadcrumb ends with the page's
  name ("Workflows"). Lightning shows no `>` after the picker, and the
  Workflows page shows the picker alone.
- **Channels' last crumb stays "Channels" while its form is open.**
  Lightning changes it to "New Channel" or "Edit Channel"; the replica's
  form is a modal over the list, so the page underneath hasn't changed.
- **"Create new workflow" is a link**, since it opens a page; disabled, it's a
  disabled button with the reason, as in Lightning, where it's always a
  button.

## Tags

- **A timed-out channel request is a warning (yellow).** Lightning draws the
  Timeout state pill orange (`channel_state_pill`); the replica puts channel
  states on Pill's tones, which have no orange.
- **Exception and Lost run states are pale grey.** Lightning draws them dark
  grey with white text (`state_pill`); the replica keeps every status pill
  pale, so a list never mixes pale and solid.

## Fields

- **A field with an error turns the typed text red too.** Lightning only
  reddens the border (`new_inputs.ex`). Red text makes the wrong value easy
  to spot. A dropdown's prompt stays dark; only a chosen value turns red.
- **The manual run's JSON error sits under the editor.** Lightning puts it
  above (`manual-run-panel/views/CustomView.tsx:91`). Every field in the
  replica reads label, hint, control, error.
- **The landing screen's "Recommended" badge sits at the right end of the
  label row.** Lightning puts it next to "Build with AI". Every field keeps
  its label, star and info icon on the left and one link or badge on the
  right, as Lightning does for "New Credential".
- **A picked option card has a primary border; the focus outline only shows
  for the keyboard.** Lightning's webhook auth type cards draw the focus
  outline round the picked card, so picked and focused look the same.

- **Info icons are a grey outline everywhere.** Lightning's LiveView pages
  draw a faded primary icon (`Common.tooltip`, `common.ex`); the
  collaborative editor draws a grey outline (`ConfigureAdaptorModal.tsx`).
  The replica uses the grey outline.


- **Contact preference explains itself in a hint.** Lightning hides the
  explanation in an info tooltip. The replica shows a shorter version under
  the label, so people see what "Critical" means before they choose.

## File uploads

- **One drop zone for both uploads.** Lightning styles the manual run upload
  (`manual-run-panel/FileUploader.tsx`) and the YAML import
  (`yaml-import/YAMLFileDropzone.tsx`) differently: a link-coloured "Upload a
  file" in one, a grey icon tile and primary "YML"/"YAML" in the other. The
  replica uses one look for both.
- **An error shows inside the zone and stays.** Lightning's manual run error
  is a red box that vanishes after 3.5 seconds, and its YAML error is red text
  under a grey zone. The replica tints the zone red, puts the message in place
  of the hint, and keeps it until a valid file comes in, so nobody misses it.
- **File types are checked by extension.** Lightning's manual run checks the
  type the browser reports, which some systems leave empty; the replica checks
  the extension in both, as Lightning's YAML import does.
- **The 8MB limit applies to both.** Lightning only enforces it on YAML import;
  the manual run hint promises it but never checks.
- **"Only 1 file can be uploaded".** Lightning's manual run says "Only 1 files
  can be uploaded".

## Type

- **The waiting messages in the log and dataclip viewers stay 12px.**
  Lightning grows them to 16px when the panel is wide
  (`viewers.ex:106,277`), the only text it sizes by panel width. In the
  replica every piece of text has one size, from `Text`.
- **A modal's title has a normal line height.** Lightning squeezes it to
  20px (`modal.ex:109`); the replica uses `Heading size="lg"` as it is, so
  the title lines up with the close button.

## Colour

- **Muted, faint and link text are a shade darker.** Lightning uses
  gray-500 for muted text, gray-400 for faint and primary-400 for links;
  the replica uses gray-600, gray-500 and primary-600, so text meets WCAG AA
  contrast on white and on the grey page (`npm run test:stories` checks it).
- **The release version under the sidebar logo is full strength.** Lightning
  fades it to half (`opacity-50`), which falls below AA contrast on the
  sidebar.
- **Work-order states, field errors and the success button are darker.**
  Lightning writes work-order states in the 500 shades next to their dot,
  field errors in danger-600, and fills the success button with
  success-600; the replica uses the 700s (success text 800), which meet AA.
- **A sandbox chip on a light colour has dark text.** Lightning always writes
  white on the sandbox's colour, which is unreadable on amber or green; the
  replica picks dark or white text by the colour's luminance
  (`prefersDarkText` in `src/utils/colour.ts`).
- **Faded text is solid instead.** Lightning fades the read-only adaptor
  (`AdaptorDisplay.tsx:197`, `opacity-50`) and the admin project form's
  users with no role (`opacity-60`); the replica writes them in muted or
  faint text, which reads as quieter but meets AA.
- **The channel timing bars are a shade lighter.** Lightning draws them in
  orange-400 and blue-400 behind 900 text (`timing.ex:277-388`); the replica
  uses the 300s, so the text on them meets AA.
- **A danger link darkens on hover.** Lightning lightens it to red-600
  (`app.css:176`), below AA on the grey page; the replica goes to
  danger-800, as other links go darker on hover.

## Accessible names

- **A control's hidden name contains the text it shows.** Lightning's log
  level button has no hidden name, and its adaptor picker names each option
  "Select <name> adaptor" (`SearchableList/ListRow.tsx:42`). The replica
  names the log level button "Log level: info", the adaptor button "Change
  adaptor: http" and the proxy URL "Copy proxy URL: <url>", and an adaptor
  option by its own text, so voice control users can say what they see.

## Keyboard

- **Picking a step or path with the keyboard moves focus into its
  inspector.** In Lightning, Enter selects a React Flow node and focus stays
  on it, so the inspector is only reached by tabbing past the rest of the
  diagram. The replica puts focus on the inspector's first field, and when
  the inspector closes, focus goes back to the step. A click leaves focus
  where it is, as in Lightning.
- **Escape closes the inspector from inside one of its fields.** Lightning's
  keyboard provider ignores Escape in inputs, so a keyboard user in the
  inspector would have no way back to the diagram. Elsewhere in the editor,
  Escape in an input still does nothing.
