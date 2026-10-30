---
paths:
  - "src/components/**"
  - "src/pages/**"
---

# Components

Where a component goes, what it may import, and how the product handles the
tasks that keep coming back. The root CLAUDE.md table says which primitive
to reach for; `src/components/CLAUDE.md` says how a component is built.

## Tiers

Each folder in `src/components/` is a tier, and imports only go down.
ESLint enforces it (`eslint.config.js`, tested in `src/lint-seam.test.ts`).
Stories and tests are exempt.

| Folder | Holds | May import |
|---|---|---|
| `src/pages/` | One Lightning view each | anything |
| `<area>/` (`history/`, `credentials/`, `workflow/`, `project-settings/`, `admin/`, `profile/`, `projects/`, …) | What only that area uses | primitives, `domain/`, `shell/`, its own area |
| `shell/` | The app chrome around every page: sidebar, project picker, user menu | primitives, `domain/`, `shell/` |
| `domain/` | Lightning pieces that two or more areas use | primitives, other `domain/` files |
| `primitives/` | General pieces | other primitives |

Every tier may import `src/utils/`, `src/types/`, `src/theme/`,
`src/routing/` and `src/constants.ts`. Utils may import primitives
(`useAction` uses `Toast`).

Only `App.tsx`, `src/index.ts` and a page's own `.replica.tsx` import a
page. Anything else a page's file holds that others need (a props type, a
helper) moves out: shapes to `src/types/`, UI to a component.

## Where a new component goes

Ask these in order and stop at the first yes.

1. **Would it make sense in another product?** Then `primitives/`, however
   many areas use it today, even one. A primitive takes plain values
   (strings, numbers, booleans, children) and says none of Lightning's
   words itself. A Lightning flavour of a general piece still counts:
   `UuidChip` is a short id with a copy tooltip, used for runs and work
   orders, and a short id makes sense anywhere. A piece named for a
   Lightning thing, or built to show one (a run, an adaptor, a webhook, a
   credential), fails this step even when all it takes is a string. Layouts
   and charts are judged the same way as anything else.
2. **Is it the app chrome around every page?** Then `shell/`.
3. **Do two or more areas use it?** Then `domain/`. "Use" counts pages:
   `ProjectDeletionModal` is opened by the admin and project settings pages,
   so it's in `domain/`. A piece is in `domain/` when it takes a Lightning
   record (a run state, an adaptor, a log line) or carries Lightning's
   wording (a delete dialog's text).
4. **Otherwise** it goes in the folder of the one area that uses it.

Two cases to watch:

- **An area's whole panel shown on another area's page stays in its area.**
  A panel is a page section with its own tables and dialogs that a page
  mounts: the credentials index (`CredentialIndex`) is shown on the user's
  Credentials page and in project settings, and stays in `credentials/`.
  Pages may compose any area. A dialog, form, pill or field is never a
  panel: if two areas open or show it, it goes in `domain/`.
- **A primitive's Lightning wrapper is not a primitive.** `ConfirmModal` is
  a primitive; `ProjectDeletionModal`, which fills it with Lightning's
  wording, follows step 3 or 4.

A primitive that needs a feature component takes it as `children` or a prop
instead of importing it.

## Patterns

How the product handles each recurring task. Copy Lightning's wording
wherever Lightning has the screen; the rules below decide only what
Lightning doesn't. STANDARDS.md has the behaviour underneath (pending,
failure, keying).

### Destructive action

Deleting or removing anything: a record, a member, access.

- **`ConfirmModal` with `tone="danger"`**, mounted only while open and keyed
  by what it's about (STANDARDS pattern 6).
- **Title and confirm label are the action and the thing**: title
  "Delete credential", confirm label "Delete credential". Where Lightning
  words it differently, use Lightning's (`CollectionDeleteModal` says
  "Delete"; `RemoveCollaboratorModal` says "Confirm").
- **The body says what will happen**, in Lightning's words.
- **Typed confirmation only where Lightning asks for it**: the project or
  sandbox name to delete a project or sandbox, the email to delete a user
  account. Nothing else asks for typing, and a new action doesn't either unless
  it deletes a whole project or account.
- **A row's delete button opens the dialog**; the dialog does the deleting.

Stories: `Primitives/ConfirmModal` (Danger, TypeToConfirm),
`Credentials/Modals` (DeleteCredential), `Domain/UserDeletionModal` (Default).

### Can't do it yet

Two shapes, chosen by why the action is blocked.

- **The user isn't allowed** (a permission, a role): keep the button,
  disable it, and give the reason as its `tooltip` (STANDARDS pattern 9).
  Never hide it unless Lightning does. A gated section adds
  `SectionHeader`'s `permissionsSection`.
- **The thing isn't ready** (a user who still owns projects or has audited
  activity, a credential with audited runs): the button stays enabled, and
  clicking it opens a plain `Modal` instead of the `ConfirmModal`. The
  modal has the action's title, says why and what has to happen first, and
  has one `variant="secondary"` button that closes it, in Lightning's words
  ("Cancel" in `UserDeletionModal`, "Ok, understood" in
  `CredentialDeletionModal`). With no Lightning wording to copy, the button
  says "Cancel". There's no confirm button, not even a disabled one.

Stories: `Primitives/Button` (Disabled), `Domain/UserDeletionModal` (Blocked),
`Credentials/Modals` (CredentialMarkedForDeletion),
`Project settings/SecurityPanel` (NoPermission).

### Settings section

- **One `Card` per group of settings**, with a `title` and a `description`. A
  tab or page of settings starts with a `SectionHeader`.
- **A switch or select saves on every change** with `useChosenValue`, and
  has no Save button. If saving fails, the control goes back and an error
  toast says why.
- **Text fields save with a button**: `useForm`, with the form's Save button
  at the bottom of its card.

Stories: `Profile/ExperimentalFeaturesCard`, `Project settings/SecurityPanel`,
`Profile/ProfileForms` (BasicInfo), `Primitives/Card` (WithHeader).

### List

- **`TableTitle`** with the title and `count` ("Workflows (3)"). Its children
  sit on the right: the `SearchInput` first, then the create `Button`.
- **`Table`** with `Tr`, `Th` and `Td` below it.
- **Row actions** go in `<Td actions>` as `Button size="xs"
  variant="secondary"`, labelled with Lightning's verb ("Edit", "Delete").
  More than two actions go in a `ButtonMenu` labelled "Actions".
- **A destructive row action** follows "Destructive action".
- **Sorting and search**: `useTableSort` for a small list that's fully
  loaded; a long list is sorted and searched by the server (STANDARDS
  pattern 3).

Stories: `Primitives/TableTitle` (WithActions), `Primitives/Table` (Default),
`Projects/WorkflowsHeader`.

### Empty list

- **`EmptyState` instead of the table**, with Lightning's message ("No
  credentials found.").
- **If the list has a create action**, the empty state is that action:
  `buttonText` and `onClick` make the dashed box a button ("Create a new
  Credential"). When the user can't create, it's `disabled`, not left out.
- **`variant="plain"`** (just the text) inside a card or a smaller list.

Stories: `Primitives/Table` (EmptyWithAction, Empty, EmptyPlain).
