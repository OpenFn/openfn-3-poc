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
- **A failed log out says so and stays.** Lightning always lands on the
  login page with "Logged out successfully.", as this app does when logging
  out works. If it fails, the page says so rather than showing the login
  page while the session may still be live.
- **A signed-out page's message is a status, not an alert.** Lightning marks
  its info message `role="alert"` on log in and reset password. Here it is
  `role="status"`, so a screen reader reads it in turn rather than
  interrupting.
- **A dead reset link is found on submit, not on opening it.** Lightning
  checks the link when it's opened, says "Reset password link is invalid or
  it has expired." and sends the person to log in. The API can't check a
  link without using it (docs/api-gaps.md), so here the form shows and,
  once submitted, goes to the request page with the same words.
- **A dead confirm link shows its error after "Confirm my account" is
  pressed.** Lightning checks the link when it's opened and goes to
  /projects with "User confirmation link is invalid or it has expired."
  Here the page shows, and the same words appear in the card once the
  button is pressed, for the same reason as reset.
- **The confirm page has no "Log in" or "Register" links.** Only someone
  signed in reaches it, so neither leads anywhere useful. The resend page
  keeps both.
- **The confirm-your-email page says "your email address" and has no
  "Change email address" form.** Lightning shows the address and a form to
  change it. The API has no route for either while locked out
  (docs/api-gaps.md), so a mistyped address needs an administrator.
- **Arriving at the confirm-your-email page shows no "Your account is
  blocked…" message.** Lightning shows it above a body that says the same
  thing.
- **A throttled or failed resend replaces "We have sent…".** Lightning keeps
  the earlier message beside the new warning; here only the latest shows.
- **On a fresh install, only log in and signed-in pages go to first setup.**
  Lightning sends every page to /first_setup until the first superuser
  exists. Here reset, register, confirm, confirm-your-email and two-factor
  opened directly stay put: none of them can do anything without an account.
  Register, with sign-up on, shows its form and its create makes the
  superuser, as first setup's does.
- **Once set up, /first_setup goes to the projects list**, where Lightning
  answers a plain-text 404. The API can't say why setup is closed
  (docs/api-gaps.md).
- **First setup and register check the email's format and the password's
  length after Save or Register, in the server's words.** Lightning checks
  while typing, and first setup shows "Password minimum length is 12
  characters." twice. Here the page checks only for blanks, the matching
  confirmation and the terms box, and the server brings the rest ("must be
  a valid email address", "should be at least 12 character(s)").
- **A signed-in visitor to register goes to the projects list, even with
  sign-up off.** Lightning answers with the plain-text "Self-signup has been
  disabled" 404. The signed-in check comes first, as on reset password.
- **A new user always lands on the projects list.** Lightning can make a
  starter project and open its new workflow page. The API can't say a
  project was made (docs/api-gaps.md).
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
  Access" there. /dashboard, which has no menu, still goes to /projects,
  without a message, because Lightning's is a whole No Access screen
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

## Channels

- **The last crumb stays "Channels" while the form is open.** Lightning
  changes it to "New Channel" or "Edit Channel". Here the form is a dialog
  over the list, so the page underneath hasn't changed.

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
  action", in an alert at the top and opens no dialog.

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
  a role, Create in the YAML import until the YAML looks right, and first
  setup's Save and register's Register until the form is valid. Here
  pressing them says what's missing ("can't be blank", "Enter YAML content to
  create workflow"), so nobody faces a dead button without knowing why. A
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
