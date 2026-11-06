# Where we differ from Lightning on purpose

What a page does starts from Lightning: the scenario tests check each page
against it. Looks and words come from openfn-ia-demo's design where it has
the screen (PRINCIPLES.md, Where the design comes from). This file lists
every place where this app does or says something different from Lightning,
or drops something, so a failing test or a comparison run can tell a
deliberate difference from a mistake.

Looks need no entry: a look that comes from openfn-ia-demo or from a
primitive (sizes, shades, spacing, focus rings) is expected to differ, and
the comparison run ignores it. Colours are darker than Lightning's in many
places so text passes contrast; docs/colour.md says how.

Add an entry in the PR that makes the difference, saying what's different
for the person using it, what Lightning does, and why. Delete it if the app
goes back to Lightning's way.

## Signing in

- **The password is required on the login form.** An empty one says "can't
  be blank". Lightning marks only the email as required, though it needs
  both, so here an empty password is caught before the form is sent.
- **Login has no Remember me checkbox.** Lightning's keeps you signed in for
  60 days. The API's sign-in has no such option yet (docs/api-gaps.md).
- **Logging out says nothing.** Lightning shows "Logged out successfully." on
  the login page. Here the login page just appears, because no message
  survives a redirect yet. If logging out fails, the page says so and stays,
  rather than showing the login page while the session may still be live.
- **The two-factor and confirm-access boxes have a label, not a heading.**
  Lightning heads the panel "Authentication Code" or "Password" and puts the
  help text under the button. Here the same words are the field's label,
  with the help text as its hint, so a screen reader reads them with the
  box.

## Moving around

- **The project menu has Build and Maintain groups, and an "All projects"
  link.** Lightning lists a project's pages in one flat list. Here, following
  openfn-ia-demo's design: "All projects", then Workflows, Channels and
  Sandboxes under Build, and History and Settings under Maintain.
- **A project page names itself in a row under the top bar.** In Lightning the
  page name is only the last crumb, and Workflows, Sandboxes and Channels
  repeat it in the body with the count and main button. Here the title row
  holds the title, its count and the main button or search ("Workflows (3)"
  with "Create new workflow"), so every page names itself in one place.
  Lightning's Workflows breadcrumb has only the project picker; here it ends
  with "Workflows".
- **History's tabs and a Health page's workflow name sit in the title row
  too.** Lightning puts History's Work Orders / Channel Logs tabs in the bar,
  and a Health page's workflow name and range picker in the page body. Here
  they join the row where the page names itself.
- **Projects and Collections keep their title and count in the bar, with
  Create beside it.** Lightning puts Create under a second "Projects (3)" /
  "Collections (3)" title in the body. Here the bar's title carries the
  count, so a second title would only repeat it.
- **A detail page puts its short id in the title.** Lightning ends the
  breadcrumb with the id. Here it ends with "Run", and the title reads "Run
  5e9a1c2b", as every page names itself in the title row. A run's
  "latest" chip sits beside the workflow's name in the run's details, since
  it names that version. Lightning puts it after the id in the breadcrumb.
- **A project you can't open shows Not Found or No Access in place**, with
  the side menu still there (the home menu, not the project's). Lightning
  sends you to /projects and shows Not Found there. The API says No Access
  to a non-member whether or not the project exists, so only a superuser
  sees Not Found (`ProjectGate`).
- **An admin page shows No Access in place to anyone but a superuser**, with
  the side menu still there. Lightning sends you to /projects and shows "No
  Access" there, which needs a message that survives a redirect. /dashboard,
  which has no menu, still goes to /projects, but without the message
  (`AdminGate`).

## Lists

- **A list page's create button stays in the header, and its empty state is
  words only.** Lightning's projects dashboard and admin collections move
  Create into a dashed "Create a new one." box when the list is empty, and
  API tokens shows the table's header with a second Generate button. Here the
  button stays in the header while the list loads, fails or is empty, so it
  never moves (`ListPage`).
- **Clickable rows can be reached from the keyboard.** Lightning's clickable
  rows only answer a click. Here each holds a link (projects, workflows) or a
  toggle (history work orders) that Tab reaches, and a click on the row
  clicks it.

## Workflows

- **Workflows follows openfn-ia-demo's design.** A line under the title says
  "Workflows move data between your connected systems.", then Name, Latest
  run and Last updated, sorted by the server from the column headers.
  Lightning also has search, four metric cards, work order counts, an on/off
  switch, Health and Delete; those wait until the design or the API calls for
  them. The button and empty state keep Lightning's words ("Create new
  workflow", "No workflows found. Create one to start automating.") without
  its "Create one" link.
- **"Create new workflow" is a link.** Lightning's is always a button. Here
  it opens a page, so it's a link; disabled, it's a button that says why.

## Workflow editor

- **Picking a step or path with the keyboard moves focus into its
  inspector.** In Lightning, Enter selects the node and focus stays on it, so
  the inspector is only reached by tabbing past the rest of the diagram. Here
  focus goes to the inspector's first field, and back to the step when the
  inspector closes. A click leaves focus where it is, as in Lightning.
- **Escape closes the inspector from inside one of its fields.** Lightning
  ignores Escape in inputs, which leaves a keyboard user no way back to the
  diagram. Elsewhere in the editor, Escape in an input still does nothing.
- **A disabled Run says why on hover.** When the manual run's JSON doesn't
  parse, "Run From Here" shows "Fix the JSON input to run". Lightning gives
  no reason.

## Dataclip

- **A dataclip that isn't there, isn't this project's, or has a malformed
  id shows No Access or Not Found in place.** Lightning sends you to History
  with "Dataclip not found" (`dataclip_live/show.ex:20-34`). The API answers
  403 for any of them but the wrong project (docs/api-gaps.md, Dataclips).
- **The breadcrumb has "History" after the project picker.** Lightning's
  ends with "Dataclip" and has no way back.
- **The details show the dataclip's name when it has one.** The API sends
  it; Lightning never shows it.
- **The details and body load together, behind one spinner, and a failed
  load shows the server's message in place of both.** Lightning shows the
  details at once, an empty viewer while the body loads, and "Failed to
  load content" in the viewer. The API sends the body with the dataclip.
- **The sidebar marks History as the current page.** Lightning marks
  nothing (`active_menu_item: :dataclip`); the dataclip is part of History.
- **Sentence case: "Dataclip details", "No data available".** Lightning
  title-cases them.

## Channels

- **The last crumb stays "Channels" while the form is open.** Lightning
  changes it to "New Channel" or "Edit Channel". Here the form is a dialog
  over the list, so the page underneath hasn't changed.
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

## Project settings

- **Disable parallel execution saves when you switch it, after a confirm.**
  Lightning puts the switch in a form with its own Save and shows the "Heads
  Up!" warning once switched. Here it asks first, with the same words, and
  saves on confirm; switching it back saves at once. Where the plan doesn't
  allow it, the switch is disabled with the plan's reason under it ("Not
  allowed on Free plans"); Lightning shows whatever control the hosted plan
  provides.

## User settings

- **Profile, Credentials and API tokens are one settings page, as in
  openfn-ia-demo's design.** The header says "User settings" with the
  design's line under it, a menu of the three sits on the left, and each
  page's title becomes its section's heading. Lightning gives each its own
  page ("User Profile", "Credentials", "Personal Access Tokens") and lists
  them in the side menu and the account menu. Here the side menu doesn't list
  them and the account menu has one "User settings" item. The URLs and what
  each page does stay Lightning's.
- **API tokens and Credentials use openfn-ia-demo's words.** "API tokens",
  "Personal access tokens let the OpenFn CLI and API act as you.", "Generate
  new token" and "No personal access tokens", where Lightning says "Personal
  Access Tokens" and "Generate New Token". Credentials gains "Credentials you
  own. Share them with any project you collaborate on."
- **Profile's cards use openfn-ia-demo's titles, with a line under each.**
  "Basic information" ("Change your name and how often we contact you."),
  "Change email" ("We'll send a confirmation link to the new address."),
  "Change password" ("Confirm your current password to set a new one."),
  "Multi-factor authentication", "GitHub access" and "Delete account"
  ("Deleting your account is irreversible, and your credentials go with
  it."). Lightning says "Change basic information", "Enable multi-factor
  authentication" and "GitHub Access", with no line under the forms.
- **Profile drops Lightning's left column**, following openfn-ia-demo's
  one-column layout, and with it "Change name, email, password, and request
  deletion.", "Created:" and "Email:". The name heads the section with
  "<email> · Member since <date>" under it, and the cards stack below.
- **Contact preference explains itself under the label.** Lightning hides
  the explanation in an info tooltip. Here a shorter version shows as the
  field's hint, so people see what "Critical" means before they choose.
- **MFA has "Set up MFA" and "Disable MFA" buttons.** Lightning's switch looks
  instant but opens a setup form or asks to confirm, so here each button
  names what it does.
- **Profile's first Save says why it's disabled.** Until something changes,
  hovering or focusing it shows "No changes to save". Lightning's is
  disabled with no reason.
- **A new password keeps this session.** Lightning signs this browser in
  again with a fresh session; the API ends only the other sessions. Both land
  on /projects.
- **Someone else's delete URL stays put.** Lightning answers
  `/profile/:id/delete` for another user with a message and goes back to
  /profile. Here the page shows the same words, "You can't perform this
  action", in an alert at the top and opens no dialog, since there's no
  message that survives a redirect yet.

## Credentials

- **Credentials has two tables, each with its own create button**, "New
  credential" and "New OAuth client", as in openfn-ia-demo's design.
  Lightning has one "Add new" menu. The tables take the design's columns:
  the external ID sits under the name, projects are listed as text, and each
  environment is named, where Lightning has an External ID column, project
  pills and a count of environments.
- **A pending transfer or a scheduled deletion shows on the row.** A badge
  says "Transfer pending" or "Scheduled for deletion", and a pending transfer
  says "Confirm it from the email we sent you." In Lightning the only sign is
  the wording in the row's menu.
- **A credential scheduled for deletion offers only Cancel deletion and
  Delete now.** Lightning also offers Transfer and Edit, but the API refuses
  both until the deletion is cancelled.
- **The result of an action shows above its table, not in a toast.** Success
  fades after five seconds, like a toast; a refusal stays until the next
  result.
- **Credentials uses openfn-ia-demo's words.** The empty tables say "No
  credentials yet" and "No OAuth clients yet". Results say "OAuth client
  created successfully" and "`<name>` deleted". The transfer, delete and
  OAuth client dialogs use the design's titles, labels and buttons, in
  sentence case, here and in project settings, which shares them; the delete
  dialog says "steps" where Lightning says "jobs".
- **Editing never shows a saved secret.** Lightning loads a credential's
  values, and an OAuth client's secret, into the edit form. Here they start
  blank and a blank one keeps what's saved, because the API never sends them.
- **For now, the credential form can only change `main`, and can't take a
  project away.** Saving says so instead of doing it. This goes when the form
  moves to the API's environment and project routes.
- **For now, OAuth credentials can't be added or edited here.** Edit says
  why. Transfer and delete still work. The API has no way to sign in to the
  provider yet.
- **A refused transfer doesn't say whether the email has an account.**
  Lightning says "User does not exist", or names the projects the person
  isn't in, which tells anyone whether they have an account. Here both get
  "They need an account and a role in every project this credential is shared
  with".
- **Sharing offers only the projects you edit or own.** Lightning offers
  every project you belong to, but the API only lets editors and above share
  there.

## Confirming it's you

- **Confirming access is a pop-up over the page, not a trip to another
  page.** Lightning sends you to `/auth/confirm_access` and back. Here every
  action that needs it opens one dialog with that page's words, then runs the
  action again once you've confirmed, so nothing you were doing is lost. A
  wrong password shows on the field rather than above the form. So there is
  no `/auth/confirm_access` route (`StepUpDialog`).
- **Turning MFA off and deleting your account ask for your password.**
  Lightning asks for neither; its Delete account only asks you to type your
  email. The API needs a freshly confirmed session for both, so the pop-up
  opens after you press Disable or Delete account, unless you confirmed in the
  last five minutes.
- **Backup codes ask for your password on the page.** Lightning sends you to
  confirm access first. Here the server holds the codes back, so the page
  opens the pop-up over itself. Closing it leaves "Confirm it's you to see
  your backup codes." and a "Confirm access" button where the codes go.

## Admin

- **The live dashboard at /dashboard is a static picture.** Lightning serves
  Phoenix's LiveDashboard there, a third-party page this app can't run.
- **The audit trail doesn't show which credential environments an event
  recorded.** Lightning lists them under a credential event. The API leaves
  them out, so there's nothing to show.
- **The audit trail's pages say "Page 2 of 3"**, not "Showing 11 to 20 of 24
  total results", and the actor is one line ("Amy Admin (demo@openfn.org)")
  with a short id under it, where Lightning puts the email under the name.
  The API sends no total and joins the actor into one string
  (docs/api-gaps.md, Audit trail: the total, and the actor).

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
- **The design's words on the list.** A line under the title, "Every
  collection on this instance, across all projects."; the storage column is
  "Size", not "Used storage" (`collection_live/components.ex`); the empty
  state is "No collections yet.", with the collections icon, not "No
  collection found." (`index.ex:89-90`). The design has this screen
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

## Admin users

- **The columns.** Name (the full name, "(you)" on your row, the email under
  it), Role ("User" or "Superuser", and "Support" for a support user) and
  Status ("Enabled" or "Disabled", and a red "Deletes 21 Oct 2026" when one is
  scheduled), all as badges. Lightning has First name, Last name, Email,
  "Role*", "Enabled?", "Support?" and "Scheduled Deletion", with ticks and
  the raw role (`user_live/components.ex`). The design has this screen and
  these columns, so they win. It has a Last login column too, which the API
  can't fill (docs/api-gaps.md, Changed, and that's fine).
- **The deletion date is a day and year, in UTC**: "Deletes 21 Oct 2026".
  Lightning shows "21 Oct  09:30", in UTC with no year and no label
  (`user_live/components.ex:131-134`, annotation 6.2), so a reader can't tell
  the year or the time zone. The time of day says nothing useful about a
  purge that runs nightly.
- **Only Name, Role and Status sort, and Name is the default.** Lightning
  sorts every column and starts on email. The design has three columns,
  each sorted by a field the API's planned `sort` takes.
- **The server searches, sorts and pages the list**, 25 to a page, the search
  300 ms after the last key, and all of it in the URL (`?q`, `?sort`, `?dir`,
  `?page`). Lightning loads every user and filters and sorts them in memory,
  with no paging, and loses both on reload or after opening the dialog
  (annotation 6.2, 6.4).
- **Row actions are buttons.** Every row has Edit; a live user has Delete; a
  scheduled one has Cancel deletion and a ••• menu holding Delete now.
  Lightning puts them all in one Actions menu (`user_live/components.ex`).
  Two quiet buttons, the rest in a menu, is the rule for every list
  (PRINCIPLES.md, Row actions).
- **A superuser's Delete is disabled with why**: "You can't delete your own
  account" on your row, "Superusers can't be deleted" on the others.
  Lightning shows a plain span with no explanation
  (`user_live/components.ex:172-187`). A blocked control stays visible and
  says why (PRINCIPLES.md, Everyone can use it).
- **Delete now is disabled, with "Not available in the API yet".** Lightning
  purges a scheduled user at once from the row's menu; the API only
  schedules deletions (`api/misfits.md`), so the item stays in the ••• menu,
  disabled, with the reason under it.
- **The words.** "New user", in sentence case, with the user-plus icon
  (Lightning: "New User"); "Filter users" (Lightning: "Filter users...");
  a line under the title and a footnote under the table in place of
  Lightning's "*Note that a superuser can access everything…"; "No users
  match." when nothing does, where Lightning shows the header with no rows.
  The design has this screen, so its words win.
- **A stale or unknown `/settings/users/:id/delete` goes to the list.**
  Lightning raises on an unknown id (`user_live/index.ex:28-32`, annotation
  6.2). A superuser's, or one already scheduled for deletion, goes to the
  list too, since neither can be scheduled.
- **Cancelling the deletion of a user who has already gone shows an error
  toast with the server's reason.** Lightning crashes and reloads the page,
  and its "Cancel user deletion failed" never says why
  (`user_live/index.ex:40-50`, annotation 6.1, 6.2).

## Admin user form

- **New user and Edit open in a dialog over the users list**, at the same
  URLs (`/settings/users/new`, `/settings/users/:id`). Lightning opens a
  page titled "New User" or "Edit User".
- **Format, length and taken-email errors appear on Save, from the
  server.** Lightning checks them as you type, hashing the password on each
  keystroke (annotation 6.4). The form checks only for blanks itself.
- **No Scheduled Deletion field.** A deletion is scheduled from the list's
  dialog. Lightning's form has a free-text date that revokes tokens without
  disabling the user or emailing them (annotation 6.2).
- **No confirmation email on create**, and so no "User created, but the
  confirmation email could not be sent". The API emails nobody it creates
  (docs/api-gaps.md, Changed, and that's fine; annotation S02, S03).
- **Creating a user with support access is two requests.** The API can't
  create one with it (docs/api-gaps.md), so the app creates the account,
  then turns support access on; if that fails, an error toast says the user
  was created without it.
- **Your own account: Role, Support user, Disabled and Email are greyed,
  each saying why, and there's no Password.** Email and password are changed
  in Profile, which links from the Email hint. Lightning lets you change all
  of them here and signs you out partway through the save (annotation 6.1).
- **The last superuser can't be demoted or disabled.** The server's refusal
  shows under Role or Disabled. Lightning lets one save lock everyone out of
  admin (annotation 6.1).
- **The heads-up shows whenever Support user is ticked**, including on
  opening an account that already has it. Lightning shows it only after a
  click (annotation 6.2).
- **The Disabled checkbox has a label**, "Disabled", with "A disabled user
  can't log in." under it. Lightning's checkbox has no label of its own
  (annotation 6.1).
- **The words.** The design's, in sentence case: "New user", "Edit" and the
  user's name, "Create user", "First name", "Last name", "Support user", and
  "Heads up" with "This user will be able to open every project that has
  support access turned on.", plus hints under Password and Role. Lightning
  has "New User", "Edit User", "Save", "First Name", "Last Name", "Support
  User", "Heads Up!" and "access ALL projects that have support access
  enabled" (annotation 6.2). Role lists User first; Lightning lists
  Superuser first.
- **An unknown `/settings/users/:id` goes to the list.** Lightning raises
  (annotation 6.2).

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

## Forms everywhere

- **No browser validation bubbles.** Lightning's forms let the browser say
  "Please fill in this field". Here that's off, so only the field's own error
  shows. Our checks cover what the browser did: blank required fields, and an
  email without an @ ("must have the @ sign and no spaces", Lightning's own
  words).
- **After a refused Save, focus moves to the first field with an error**, so
  keyboard and screen reader users land on the problem. Lightning leaves
  focus on the button.
- **A form's buttons sit on the right, the main action last.** Lightning's
  settings and admin forms put Save first, on the left; its dialogs put it on
  the right. Here every form uses the dialog's order, Cancel then Save, so
  Save is in the same place everywhere.
- **A setting that only applies on Save is a checkbox, not a switch**:
  Channels' Enabled and the admin user form's Support User. Lightning uses a
  switch for both, which looks like it takes effect at once.
- **Save and Create stay pressable until the form is right.** Lightning
  disables Save in the collaborator dialogs until every row has an email and
  a role, Create in the YAML import until the YAML looks right, the admin
  collection's Save until its name is URL safe, and the admin user's Save
  with "All fields are required", even on edit, where the password is
  optional. Here pressing them says what's missing ("can't be blank",
  "Enter YAML content to create workflow"), so nobody faces a dead button without knowing why. A
  row's email error shows only then, not while typing.
- **"Will be named …" hides while the name has an error.** Lightning does
  this only in the sandbox form; its project and collection forms show "Your
  project will be named my_project." under "has invalid format". The
  annotations call Lightning's way a bug.
- **Pending buttons, and disabled buttons that say why, keep keyboard
  focus.** Lightning disables them outright, which drops focus and hides the
  reason from the keyboard. Here they ignore presses but stay focusable
  (`aria-disabled`). A disabled button with no reason is disabled outright in
  both.
- **An error toast stays until you close it.** Lightning hides every toast
  after 5 seconds, so a failure is easy to miss. Success toasts still fade
  after 5 seconds.

## File uploads

The manual run's upload and the YAML import share one drop zone, and so one
set of rules (`FileDropZone`).

- **An error shows inside the zone and stays until a valid file comes in.**
  Lightning's manual run error vanishes after 3.5 seconds, which is easy to
  miss.
- **File types are checked by extension.** Lightning's manual run checks the
  type the browser reports, which some systems leave empty, so a good file
  can be refused; its YAML import already checks the extension.
- **The 8MB limit applies to both.** Lightning only enforces it on YAML
  import; the manual run's hint promises it but never checks.
- **"Only 1 file can be uploaded".** Lightning's manual run says "Only 1
  files can be uploaded", a slip.

## Accessible names

- **A control's hidden name contains the text it shows.** Lightning's log
  level button has no name, and it names each adaptor option "Select <name>
  adaptor". Here they read "Log level: info", "Change adaptor: http" and
  "Copy proxy URL: <url>", and an adaptor option by its own text, so voice
  control users can say what they see.
