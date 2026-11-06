# Where we differ from Lightning on purpose

What a page does starts from Lightning: the scenario tests check each page
against it. Looks and words come from Brandon's design where he has the
screen (PRINCIPLES.md, Where the design comes from). Every place this app
does or says something different from Lightning, or drops something, is
listed here, so a failing test or a comparison run can be told apart from a
mistake. Each entry says what Lightning does, where, and why we differ.

Looks that come from Brandon's design don't need an entry. The older entries
below are mostly where Lightning styles the same thing two ways and the
replica picked one.

Add an entry in the PR that makes the difference; delete it if the replica
goes back to Lightning's way.

## Buttons

- **Pending buttons, and disabled buttons that say why, keep keyboard focus.**
  They're `aria-disabled` and ignore presses, so focus isn't lost when a
  button goes pending and Tab reaches the tooltip's reason. Lightning
  disables them natively (`new_inputs.ex:268-280`, `phx-disable-with`), which
  drops focus and hides the reason from the keyboard. A disabled button with
  no reason is natively disabled in both.
- **Disabled buttons take their own colours, the same family as Lightning's.**
  Primary, danger and success fill with their 300 shade, as Lightning does
  (`new_inputs.ex:232-247`), and secondary and plain buttons go grey
  (`bg-disabled`, `text-disabled`). They are roles, not a fade, so a theme can
  change them (docs/colour.md).
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
  row reads "Run 5e9a1c2b". How a short id looks is still open. A
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
- **Workflows is Brandon's list** (D40, D44, D45): a line under the title,
  "Workflows move data between your connected systems.", then Name, Latest
  run and Last updated, sorted by the server from the column headers. Search,
  the four metric cards, the work order counts, the on/off switch, Health
  and Delete are gone until his design or the API calls for them. The empty
  state keeps Lightning's words without the "Create one" link, since Create
  stays in the header.
- **A workflow panel's title stays on one line.** A long node name ends
  in "…", with the full title on hover. Lightning wraps it
  (`collaborative-editor/components/inspector/InspectorLayout.tsx`), which
  makes the header a different height for each node.

## User settings

- **Profile, Credentials and API tokens are one settings page, as in
  Brandon's UserSettingsPage** (openfn-ia-demo `src/pages/UserSettingsPage.tsx`,
  `components/patterns/SettingsLayout.tsx`). The header says "User
  settings" with his line under it, a menu of the three sits on the left,
  and each page's own title becomes its section's heading. Lightning gives
  each its own page title ("User Profile", "Credentials", "Personal Access
  Tokens") and reaches them only from the side menu (`menu.ex:105-108`).
  Like his, the side menu no longer lists them and the account menu has one
  "User settings" item (Lightning lists Projects, User Profile, Credentials
  and API Tokens in both, `layout_components.ex:165-170`); the settings menu
  lists the three. The URLs and everything each page does stay Lightning's.
- **The sections use his words.** "API tokens" with "Personal access tokens
  let the OpenFn CLI and API act as you.", a "Generate new token" button
  and "No personal access tokens" when there are none (Lightning:
  "Personal Access Tokens", "Generate New Token",
  `tokens_live/index.html.heex:13-18`). Credentials gains his line
  "Credentials you own. Share them with any project you collaborate on."
  Profile's section is headed by the user's name, as in his design, with
  its cards as subheadings under it. The cards take his titles and the line
  under each: "Basic information" ("Change your name and how often we
  contact you."), "Change email", "Change password", "Multi-factor
  authentication", "GitHub access" and "Delete account" ("Deleting your
  account is irreversible, and your credentials go with it.") (Lightning:
  "Change basic information", "Enable multi-factor authentication",
  "GitHub Access", and no line under the forms).
- **Profile is one column, in Brandon's layout.** Lightning's left column
  (the name, "Change name, email, password, and request deletion.", then
  "Created:" and "Email:") is gone: the name heads the section, with
  "<email> · Member since <date>" under it, and the cards stack below. The
  line about what the page does is dropped; the card titles say it.
  "Delete account" stays a card with his line rather than his red callout:
  our danger alert is announced to screen readers as an alert, which suits a
  message, not a standing section.
- **Parts of his screen we leave out, and why.**
  - His breadcrumb ("User settings › API tokens"): Lightning has none here,
    and the menu already marks the page.
  - A "Generate new token" button in the empty state: one create button on
    screen, as on every list page, and it stays in the section's header.
  - His amber "Copy your token now" warning: the new-token banner keeps
    Lightning's blue info alert and words until a second page needs a
    warning tone.
  - His "Organization credentials live in Systems" note on Credentials:
    the API has no organisations or systems yet.
- **Credentials has two tables, each with its own create button.**
  "New credential" and "New OAuth client", as in openfn-ia-demo, where
  Lightning has one "Add new" menu. The tables take openfn-ia-demo's
  columns: the external ID sits under the name, projects are listed as
  text, and each environment is named, where Lightning has an External ID
  column, project pills and a count of environments.
- **You can see a pending transfer or a scheduled deletion on the row.** A
  badge says "Transfer pending" or "Scheduled for deletion", and a pending
  transfer says "Confirm it from the email we sent you." In Lightning the
  only sign is the wording in the row's menu.
- **A credential scheduled for deletion offers only Cancel deletion and
  Delete now.** Lightning also offers Transfer and Edit, but the API refuses
  both until the deletion is cancelled.
- **The result of an action shows above its table, not in a toast.**
  Success fades after five seconds, like a toast; a refusal stays until the
  next result.
- **openfn-ia-demo's words, where it has the screen.** The empty tables say
  "No credentials yet" and "No OAuth clients yet". Results say "OAuth client
  created successfully" and "`<name>` deleted". The transfer, delete and
  OAuth client dialogs use its titles, labels and buttons, in sentence case,
  here and in project settings, which shares them; the delete dialog says
  "steps" where Lightning says "jobs".
- **Editing never shows a saved secret.** Lightning loads a credential's
  values, and an OAuth client's secret, into the edit form. Here they start
  blank and a blank one keeps what's saved, because the API never sends
  them.
- **For now, the credential form can only change `main`, and can't take
  a project away.** Saving says so instead of doing it. This goes when the
  form moves to the API's environment and project routes.
- **For now, OAuth credentials can't be added or edited here.** Edit says
  why. Transfer and delete still work. The API has no way to sign in to the
  provider yet.
- **A refused transfer doesn't say whether the email has an account.**
  Lightning says "User does not exist", or names the projects the person
  isn't in, which tells anyone who has an account. Here both get "They need
  an account and a role in every project this credential is shared with".
- **Sharing offers only the projects you edit or own.** Lightning offers
  every project you belong to, but the API only lets editors and above
  share there.
- **Layout.** Backup codes stays a page of its own, as in Lightning: it is a
  step after setting up MFA, not a section.

## Tags

- **A timed-out channel request is a warning (yellow).** Lightning draws the
  Timeout state pill orange (`channel_state_pill`); the replica puts channel
  states on Pill's tones, which have no orange.
- **Exception and Lost run states are pale grey.** Lightning draws them dark
  grey with white text (`state_pill`); the replica keeps every status pill
  pale, so a list never mixes pale and solid.

## Fields

- **A name field hides "will be named …" while the name has an error.**
  Lightning does this only in the sandbox form; its project and collection
  forms keep the badge, so "Your project will be named my_project." sits
  under "has invalid format" (`settings.html.heex:124-128`, `project.ex:108`).
  The annotations mark that a bug to fix.
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

- **A form's buttons sit on the right, the main action last.** Lightning's
  settings and admin forms put Save on the left, before Cancel (profile,
  project setup, data storage, MFA, the admin user, project and auth
  provider forms, first setup); its modals put it on the right. The replica
  uses the modal's order everywhere: Cancel, then Save. The auth provider's
  Test sits before Save.
- **No browser validation bubbles.** Lightning's forms let the browser show
  "Please fill in this field" for a required field. The replica turns that
  off, so only the field's own error shows, in the same red as every other.
  Our checks cover what the browser did: blank required fields, and an email
  without an @ ("must have the @ sign and no spaces", Lightning's own words).
- **After a refused Save, focus moves to the first field with an error.**
  Lightning leaves focus on the button.

- **Data storage shows one card per setting.** Lightning puts its three
  settings in one card, each with a heading, a paragraph and a divider
  (`settings.html.heex:862-1053`). The replica gives each its own card with
  a title and description, like every other settings tab, and one Save below
  them. The plan's limit note is the History dropdown's hint. When the
  Input/Output retention period doesn't apply, its dropdown is disabled;
  Lightning also fades that section's title and description.

- **A setting that waits for Save is a checkbox, not a switch.** Lightning
  uses switches for the admin user's Support User and a channel's Enabled,
  though neither applies until you press Save. The replica keeps switches for
  things that take effect at once (enabling from a table, requiring MFA,
  support access, experimental features), and for on/off settings in the
  workflow editor (PRINCIPLES.md).
- **Profile MFA has "Set up MFA" and "Disable MFA" buttons.** Lightning's
  switch looks instant but starts a set-up form or asks to confirm, so the
  replica shows the action it is.

- **Disable parallel execution saves as you switch it, after a confirm.**
  Lightning puts the switch in a form with its own Save and shows the "Heads
  Up!" warning once switched. The replica asks first, with the same words,
  and saves on confirm; switching it back off saves at once.
  Lightning lets the hosted plan swap in its own control here; the replica
  keeps the switch and shows the plan's reason ("Not allowed on Free plans")
  under it, disabled.

- **The login password is required.** Lightning marks only the email as
  required on the login form. The replica marks both, and says "can't be
  blank" for an empty password.
- **Login has no Remember me checkbox.** Lightning's keeps you signed in for
  60 days (`user_session_html/new.html.heex`, `UserAuth.log_in_user/3`).
  `POST /api/session` has no `remember_me` field (api/account.md), so the
  replica leaves the box out until it does (docs/api-gaps.md).
- **Logging out and being sent to log in say nothing yet.** Lightning
  flashes "Logged out successfully." after `/users/log_out`, and "You must
  log in to access this page." when it sends a signed-out person to log in
  (`user_auth.ex`). The replica has no flash that survives a redirect yet
  (STANDARDS.md pattern 7), so the login page just appears. If signing out
  fails, the replica says so and stays, rather than showing the login page
  while the session may still be live.

- **Save stays pressable in the collaborator, YAML import and admin
  collection modals.** Lightning disables Save until every row has an email
  and a role, disables Create until the YAML looks right, and disables the
  collection's Save until its name is URL safe. The replica keeps them
  pressable and says what's missing when pressed ("can't be blank", "Enter
  YAML content to create workflow"), and shows a row's email error only
  then, not while typing.
- **A disabled Run says why on hover.** When the manual run's JSON doesn't
  parse, "Run From Here" shows "Fix the JSON input to run".

- **Two-factor and confirm access are ordinary fields.** Lightning gives the
  panel a large heading ("Password", "Authentication Code") and puts the help
  text under the Verify or Confirm button. The replica uses a field label,
  then the help text as its hint, then the box, as on every other form.
- **Profile's first Save says why it's disabled.** Until something changes,
  hovering or focusing it shows "No changes to save".

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

## Toasts

- **An error toast stays until dismissed.** Lightning hides every toast
  after 5 seconds, so a failure reported after a redirect is easy to miss
  (its own audit flags this: `shared-flash-messages.md`, section 6.2).
  Success toasts still fade after 5 seconds.

## Empty states

- **One look for "nothing here" and "loading".** Lightning builds them a
  dozen ways: the table's dashed `empty_state` (`table.ex:313`), History's
  `async_filler` row, centred muted text in the run viewer and manual run
  panel, its own blocks in MiniHistory and the sandboxes list. The replica
  uses `EmptyState` for all of them, and `Table`'s `state` for a list that
  is loading or failed. History's loading and error messages sit under the
  table's header, not in a row of the body.
- **No header-only table when a list is empty.** Lightning's API tokens page
  shows the table's header, then the empty state with a second Generate New
  Token button (`tokens_live/index.html.heex`); the replica shows only the
  empty state, as every other list does, and the button stays in the header.
- **A list page's create button stays in the header, and its empty state is
  words only.** Lightning's projects dashboard and admin collections take
  Create out of the header when the list is empty and put it in a dashed
  "Create a new one." box (`DashboardLive.Components.user_projects_table`);
  most of its other lists keep it in the header. The replica keeps it in the
  header on every list page, while the list loads, fails or is empty, so
  there's one rule and the button never moves (`ListPage`).
- **14px text.** Lightning's dashed `empty_state` is 12px (`text-xs`); its
  other empty states are 14px. The replica uses 14px in every one.
- **24px icon.** Lightning's dashed `empty_state` icon is 48px (`w-12 h-12`)
  and its other empty states use 32px; the replica uses 24px in every one.

## Project access

- **A project you can't open shows Not Found or No Access in place**, with
  the sidebar still there. Lightning redirects to /projects and shows Not
  Found there. ProjectGate shows the API's answer where the page would be:
  the API says No Access (403) to a non-member whether or not the project
  exists, and only a superuser hears Not Found.
- **An admin page shows No Access in place to anyone but a superuser**, with
  the sidebar still there. Lightning redirects to /projects and shows "No
  Access" there, which needs a message that survives a redirect (the same
  hole as "Logged out successfully."). AdminGate shows the same words where
  the page would be. /dashboard, which has no sidebar, still redirects to
  /projects, but without the message.

## Side menu

- **The project menu has Build and Maintain groups and an "All projects"
  link.** Lightning lists the project's pages in one flat run
  (`Menu.project_items`, from `layout_components.ex:221`). The replica
  follows Brandon's design: "All projects" (to /projects), then Workflows,
  Channels and Sandboxes under Build, and History and Settings under
  Maintain. Collapsed, the group names are hidden and only screen readers
  get them.

## Confirm access

- **Confirming access is a pop-up on the page, not a trip to a page.**
  Lightning sends the person to `/auth/confirm_access` and back
  (`user_auth.ex:397-410`). Every action that needs it opens one dialog,
  `StepUpDialog`, with that page's words, and runs the action again once the
  person has confirmed, so nothing they were doing is lost. A wrong password
  shows on the field rather than above the form.
- **Turning MFA off and deleting your account ask for your password.**
  Lightning asks for neither: `/profile` isn't a sudo route, and deleting
  only asks you to type your email. The API needs a stepped-up session for
  both (`api/account.md`, Turn off MFA; `api/users.md`, Delete a user), so
  the popup opens after you press Disable or Delete account, unless you
  confirmed in the last five minutes.
- **A new password keeps this session.** Lightning signs this browser in
  again with a fresh session after a password change; the API ends only the
  other sessions (`api/users.md`, Update a user). Both land on /projects.
- **Someone else's delete URL stays put.** Lightning answers
  `/profile/:id/delete` for another user with a flash and goes back to
  /profile. The page shows the same words, "You can't perform this action",
  in an alert at the top and opens no dialog.
- **Backup codes ask for your password on the page.** Lightning sends you
  to Confirm access first. Here the server holds the codes back, so the page
  opens the same pop-up over itself. Closing it leaves "Confirm it's you to
  see your backup codes." and a "Confirm access" button where the codes go.
- **The replica has no `/auth/confirm_access` route.** Nothing sends anyone
  there, and on the API confirming is one `POST /api/session` the dialog
  already sends. The page itself (`src/pages/auth/confirm-access/`) stays,
  with its stories, because Lightning's design-system port renders it on its
  own confirm-access screen.

## Admin collections

- **Delete is disabled, with "Not available in the API yet".** Lightning
  lets a superuser delete any collection (`collection_live/index.ex:48-62`);
  the API's delete needs a project owner or admin, with no superuser scope
  planned (docs/api-gaps.md, We clearly need these).
- **The name hint says names are unique within their project.** Lightning
  says "across all projects within this instance"
  (`collection_creation_modal.ex:135`), which has been false since names
  became unique per project.
- **The create form's project picker starts blank**, with "Select a
  project", and Save with none chosen says it can't be blank. Lightning
  preselects the first project alphabetically
  (`collection_creation_modal.ex:146-152`), so it's easy to create a
  collection in the wrong project.
- **The picker labels sandboxes "parent/sandbox"**, from the API's
  `display_name`, sorted by that label. Lightning shows bare names
  (`collection_creation_modal.ex:30-32`), so projects with the same name
  can't be told apart.
- **The sort lives in the URL and survives a save.** Lightning keeps it in
  the LiveView's assigns and every save or close remounts the page, so it
  falls back to name (`index.ex:54`, `:62`).
- **The name field keeps what was typed.** Lightning replaces it with the
  URL-safe name once the field loses focus (`collection_creation_modal.ex:133`);
  the replica shows the typed text, with "This collection will be named x"
  under it, as the project and sandbox forms do.
- **Modal words.** "Create collection" and "Edit collection" as titles, and
  "Create collection" or "Save changes" on the button; Lightning has
  "Create Collection", "Edit Collection" and "Save"
  (`collection_creation_modal.ex:103-105`). Sentence case, and a button
  says what it does (PRINCIPLES.md, Words).
- **Brandon's words on the list.** A line under the title, "Every
  collection on this instance, across all projects."; the storage column is
  "Size", not "Used storage" (`collection_live/components.ex`); the empty
  state is "No collections yet.", with the collections icon, not "No
  collection found." (`index.ex:89-90`). His design has this screen
  (openfn-ia-demo `AdminSettingsPage.tsx`, `AdminCollectionTable.tsx`), so
  its words win.

## Admin authentication

- **No Test button.** Lightning tests the discovery URL without saving,
  and Save doesn't wait for a passing test, so a plaintext `http://` URL
  can be saved and then fails every sign-in (`form_component.ex:196-203`).
  Here Save does the check and refuses a discovery document it can't use,
  under Discovery URL. The API has no way to check without saving
  (api/misfits.md, Form helpers). Lightning's scenarios S05 to S07 don't
  apply.
- **No Redirect host field.** Lightning lets the superuser type the host
  the redirect URI starts with (`auth_config_form.ex:47-49`); here it starts
  with the instance's own URL, as the API builds `redirect_uri`.
- **No "Trust unverified emails from this provider" checkbox**, until the
  API has the field (docs/api-gaps.md, We clearly need these).
- **/settings/authentication/new shows the provider when one exists.**
  Lightning shows a blank form there, and saving it adds a second provider,
  after which the edit page crashes (`index.ex:42-48`). The side menu links
  to /new, so it was easy to hit.
- **Remove asks first**, in a dialog that names the provider. Lightning
  removes at once, though its copy says it turns off external
  authentication (`form_component.ex:272-289`).
- **The stored client secret never reaches the browser.** Lightning writes
  it into the edit page's HTML as the input's value
  (`form_component.ex:168-174`); here the box is blank and a blank secret
  keeps the stored one.
- **Save is never disabled, and the name's format and the https rule come
  back from the server on Save.** Lightning disables Save while the form is
  invalid and checks the name and URL as you type (`auth_config_form.ex`);
  here the client checks only blanks (PRINCIPLES.md, Forms).
- **The page's words and layout are openfn-ia-demo's**: one column, the line
  under the title, the "No provider set up" notice, sentence-case labels
  ("Client secret"), the redirect URI with a copy button, and the "Remove
  provider" card. Lightning's Google help paragraphs and links go, since
  they named one provider only (`form_component.ex:214-234`, `:260-270`).

## Admin projects

- **No Edit.** Lightning's superuser can rename any project and change its
  members (`project_live/index.ex:56-67`). The API refuses a superuser who
  isn't a member on every route that reads or changes one project, with no
  superuser scope planned (docs/api-gaps.md, We clearly need these), so the row
  has no Edit and `/settings/projects/:id` goes to the list.
- **Delete now is disabled, with "Not available in the API yet".** Lightning
  purges a scheduled project at once from the row's menu; the API only
  schedules deletions (`api/misfits.md`), so the item stays in the ••• menu,
  disabled, with the reason under it.
- **New project opens in a modal over the list, at the same URL**, and the
  title stays "Projects". Lightning swaps the list for a page titled "New
  Project" at `/settings/projects/new` (`index.ex:72`).
- **The columns.** Project (with a red "Deletes 10 Nov 2026" when one is
  scheduled), Owner, Members and Created, a date with no time. Lightning has
  Name, Created At, Description, Owner and Scheduled Deletion, with times as
  "%d %b  %H:%M" (`index.html.heex:82-108`). The design has this screen
  and these columns (`AdminProjectTable.tsx`), so they win. The search still
  matches the description.
- **Row actions are buttons.** A live project has Delete; a scheduled one has
  Cancel deletion and a ••• menu holding Delete now. Lightning puts Edit,
  Delete, Cancel deletion and Delete now in one Actions menu
  (`index.html.heex`). Two quiet buttons, the rest in a menu, is the rule for
  every list (PRINCIPLES.md, Row actions).
- **The server searches, sorts and pages the list**, 25 to a page, the search
  300 ms after the last key, and all of it in the URL (`?q`, `?sort`, `?dir`,
  `?page`). Lightning loads every project and filters and sorts them in
  memory, with no paging (annotation 6.4), so a large instance's list is slow.
- **Only Project and Created sort.** Lightning sorts all five columns. The
  API sorts by name and creation date only (docs/api-gaps.md, Admin
  projects).
- **Sandboxes show as "parent/sandbox"**, from the API's `display_name`.
  Lightning lists them under their bare names, so a sandbox can't be told
  from a project with the same name (annotation 6.2). They still sort and
  search by their own name, as the API does, so `parent/sandbox` sorts
  under "sandbox". Deleting one asks you to type that label, as the row
  shows it.
- **The words.** A line under the title, "Every project on this instance,
  whoever is in it."; "New project", in sentence case, with the folder
  icon (Lightning: "New Project"); the modal's "New project" and "Create project" (Lightning: "New
  Project" and "Save"); "Members" (Lightning: "Manage project users");
  "Filter projects" and "Filter users" (Lightning adds "..."); "Every project
  must have exactly one owner." (Lightning adds "Please specify one below.").
  The design has this screen, so its words win.
- **The empty state is "No projects match."**, with the folder icon, with or
  without a search. Lightning shows the table's header with no rows and no
  words (`project_live/index.html.heex`), so nothing says the search found
  nothing; the design's words fill that.
- **The form has a Description field**, sent with the name; Lightning's form
  has none though its list shows and searches descriptions (annotation 6.2).
  The design has the field, so it stays.
- **Each person's role is a select** ("No access", "Owner", "Admin",
  "Editor", "Viewer"), one per row, in place of Lightning's five radio
  columns, whose headers looked sortable and weren't (annotation 6.1).
- **Disabled users aren't offered as members**, and someone scheduled for
  deletion is disabled. Lightning lists every user and emails a disabled one
  that they now have access (annotation 6.1).
- **Two owners are refused by the server on Create**, under Members.
  Lightning flags "A project can have only one owner." as you pick and
  disables Save until it's fixed (`form_component.html.heex:191`); here the
  client checks only for a name and an owner, and Create is never disabled
  for an invalid form.
- **The name field keeps what was typed**, with "Note that this project will
  be named: x" under it. Lightning puts the URL-safe name back in the field
  on re-render (`form_component.html.heex:12-17`), so what you typed changes
  under you; every other name field here keeps it.
- **Filtering the member grid keeps every role already given.** Lightning
  drops the hidden rows from the form, so an owner picked before filtering
  vanishes (annotation 6.1).
- **A stale or unknown `/settings/projects/:id/delete` goes to the list.**
  Lightning crashes on an unknown id (`index.html.heex:19`). One already
  scheduled for deletion goes to the list too.

## Channels

- **No Total channels or Total requests cards, and no "View all".**
  openfn-ia-demo shows none, as Workflows dropped its cards; the title still
  counts the channels, and History's Channel Logs lists every request.
- **A switched-off channel's name isn't greyed, and its switch has no
  "<name> (disabled)" tooltip.** The Enabled column already says it. Row
  Delete is a quiet button, not red, as on the admin lists.
- **Delete asks in a dialog with openfn-ia-demo's words**, "Delete <name>?"
  and "Delete channel", and says the request history goes too, which
  Lightning deletes without saying (api/channels.md). Lightning uses the
  browser's confirm: 'Delete "<name>"? This cannot be undone.'
- **With no client credential ticked, the form warns that anyone with the
  proxy URL can use the channel.** Lightning says nothing, and an open
  channel forwards anyone's request with the destination credential added
  (annotation 6.1).
- **Switching a channel on or off shows no toast.** The switch's new
  position is the confirmation; Lightning flashes "Channel updated". A refused
  switch goes back and shows the server's message in a toast that stays.
- **`/channels/new` or `/channels/:id/edit` without permission, and an edit
  for a channel this project doesn't have, go to the list with no message.**
  Lightning flashes "You are not authorized to create channels." or
  "Channel not found"; nothing here carries a message across a redirect yet.
- **A save refused for a stale version shows the server's message in the
  form; one refused for a credential or auth method outside the project shows
  it under that field.** Lightning's form shows nothing (annotation 6.1), so
  the save seems to do nothing.
- **openfn-ia-demo's words and form order, where it has the screen.** "New
  channel" with a plus, the line under the title, "No channels yet.", "New
  channel" / "Edit <name>", "Create channel" on create, "Created <name>.",
  "Add new", its hints, and Enabled last in the form. Lightning says "New
  Channel", "No channels found.", "New Channel" / "Edit Channel", "Save" on
  create, "Channel created successfully." and "Add New", with Enabled second.
- **Opening `/channels/new` or `/channels/:id/edit` directly shows the list
  behind the form.** Lightning shows zero totals and "No channels found."
  until the form closes (annotation 6.1).

## Sandboxes

- **Cards sit under "Selected" and "Active", as openfn-ia-demo has them.**
  The page's project is under Selected with a "Selected" badge, the rest of
  the workspace under Active (the top project first, with "Main"), then
  Lightning's "Scheduled for deletion". Each card has a description ("No
  description" without one) and "Made from <parent>". Lightning lists the
  root, then the sandboxes, with env badges and an "active" badge; the API
  sends no env, and openfn-ia-demo shows none.
- **A card's name opens its project, not the whole card.** The card also
  holds the ••• menu, and a button can't hold another; Lightning makes the
  card's body a `role="button"`. The card you're in opens nothing.
- **The three action icons are one ••• menu**, "Actions for <name>", with
  Edit, Merge and Delete last in red, each greyed with Lightning's reason
  (PRINCIPLES, Row actions). Lightning shows three icon buttons.
- **No actions on the top sandbox of someone who's only in a sandbox.**
  Nothing above it lists it, so nothing sends its permissions
  (docs/api-gaps.md). Lightning lets its admins edit and delete it.
- **A taken name shows when you press Create sandbox or Save, not as you
  type.** The client checks only a blank name; the server checks the rest.
- **New sandbox isn't disabled at the nesting limit.** The API doesn't say a
  project is at it (docs/api-gaps.md), so the form shows the server's
  "Maximum sandbox nesting depth reached". Lightning disables the button.
- **A new sandbox's first colour follows how many sandboxes there are**, as
  openfn-ia-demo picks it, not chance, so two in a row differ.
- **Deleting the sandbox you're in takes you to the nearest project above it
  you can open, and the dialog names that one.** Lightning names the root
  and goes to the parent, which someone in only the sandbox can't open
  (annotation 6.1).
- **Edit links stay under the page's project.** Lightning's go under the
  sandbox's parent, which 404s for someone in only the sandbox (annotation
  6.1).
- **The delete and merge warnings count only the sandboxes you can see.**
  Lightning counts every one below (docs/api-gaps.md).
- **Merge lists only the workflows a merge would change, has no collections
  section, and offers projects the server may refuse.** A refused merge
  stays in the dialog with the server's message; Lightning closes it with
  "Couldn't merge this sandbox. Please try again." Lightning offers only
  projects where you're an editor or above, and lets you untick collections
  (docs/api-gaps.md).
- **`/sandboxes/new` without permission, and an edit of a sandbox that isn't
  listed or you can't edit, go to the list with no message.** Lightning
  flashes; nothing here carries a message across a redirect yet.
- **openfn-ia-demo's words, where it has the screen.** The line under the
  title, "New sandbox", "No other sandboxes", "New sandbox" / "Edit <name>",
  "Create sandbox" / "Save", "My sandbox", "Colour" with its hint,
  "Created a sandbox from <parent>.", and the merge dialog's "Merge into",
  "Changed in <target> too", its warning, "Credentials only in this
  sandbox" and "Merge into <target>". Lightning says "Create Sandbox",
  "Create a new sandbox" / "Edit sandbox", "Save changes", "Color" and
  "Sandbox created".

## Channel request

- **A request that isn't there, isn't this project's, or has a malformed id
  shows No Access or Not Found in place.** Lightning sends you to History
  without a word. The API answers 403 for any of them but another project's
  (docs/api-gaps.md, Channel requests).
- **The summary shows the channel name and destination URL the request
  used**, from its snapshot. Lightning shows the channel's current ones, so
  after an edit its summary names a destination the request never went to.
- **The title and summary show the request id clients and destinations
  see** (`x-request-id`, the one Channel logs lists). Lightning shows the
  database id, which stays in the URL.
- **A deleted client auth method or destination credential reads
  "(deleted)".** Lightning's helper says so too, but its database clears the
  reference when the record goes, so its page reads "None", as for a
  request with no auth (annotation 6.1).
- **An error code Lightning doesn't recognise reads "No response received"
  with the code**, and the timing shows. Lightning shows an empty Response
  card.
- **No body hash or "Copy hash", and no "(reused)" on the Connect bar.** The
  API doesn't send them (docs/api-gaps.md).
- **Sentence case: "Channel request", "Channel name", "Config version".**
  Lightning title-cases them.

## Audit

- **The audit trail no longer shows which credential environments an event
  recorded.** Lightning's page lists the encrypted bodies under a credential
  event (`audit_live/index.html.heex`). The API leaves them out of
  `GET /api/audit_events` (api/audit-events.md), so the page has none to show.
- **The audit trail's pagination says "Page 2 of 3", not "Showing 11 to 20 of
  24 total results"**, and the actor is one line ("Amy Admin
  (demo@openfn.org)") with the actor's short id under it, where Lightning puts
  the email under the name. The API sends no total and joins the actor into
  one string (docs/api-gaps.md, Audit trail).

## Type

- **The waiting messages in the log and dataclip viewers stay 12px.**
  Lightning grows them to 16px when the panel is wide
  (`viewers.ex:106,277`), the only text it sizes by panel width. In the
  replica every piece of text has one size, from `Text`.
- **A modal's title has a normal line height.** Lightning squeezes it to
  20px (`modal.ex:109`); the replica uses `Heading size="lg"` as it is, so
  the title lines up with the close button.
- **Workflow Health's "Triage - grouped by failure type" is a normal
  section heading.** Lightning makes it a small grey uppercase label
  (`assets/js/health/WorkflowHealth.tsx:172`), unlike the card titles
  beside it; the replica uses `Section`'s heading, so it matches Outcomes
  and Failure breakdown.

## Spacing

- **The run page's details and step list have a gap when side by side.**
  Below the wide layout (main area under 64rem), Lightning puts them in a row
  with only a vertical gap (`run_live/show.ex:103`), so the step list touches
  the details' values. The replica uses the same 24px gap both ways.

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
- **The channel timing bars use the tag colours.** Lightning draws them in
  the 300s and 400s behind 900 text (`timing.ex:277-388`); the replica uses
  each hue's tag pair (a 100 fill, 700 text), the same colours as a tag of
  that hue, so the text meets AA in every theme.
- **A run state is one colour everywhere.** Lightning draws a state in
  different shades in its pill, dot, text, step icon and canvas node (a
  crash is orange-800 as an icon and orange-500 as text), and its health
  charts use another set again (crashed pink, killed purple, lost teal,
  exception blue). The replica gives each state a tone (docs/colour.md, Run
  states) and draws its roles in every place: crashed is orange, killed
  yellow, and pending, cancelled, lost and exception grey, in the charts
  too.
- **The selected item is one colour.** The current page, active filter chip,
  chosen row and tab underline share `bg-selected`, `text-selected` and
  `border-selected` (primary-50, 600 and 600). Lightning varies the edge
  between 500 and 600 and an active chip's text between 600 and 700.
- **Tooltips are dark grey, not dark indigo** (`bg-inverse`), like the
  replica's other dark badges.
- **Alert and warning icons are darker.** Lightning draws alert icons in the
  400s; the replica uses each tone's icon role, which reaches 3:1 on white
  (the warning icon is yellow-700).
- **The live dashboard's cards are the brand fill**, not Phoenix's
  gradients; it is a static stand-in for a third-party page.
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
- **Clickable table rows can be reached from the keyboard.** Lightning's
  clickable rows only respond to a click. In the replica each one holds a link
  (projects, workflows) or a toggle button (history work orders) that Tab
  reaches, and a click on the row clicks it.
