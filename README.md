# OpenFn Lightning, in React

A clickable replica of [OpenFn Lightning](https://github.com/OpenFn/lightning)'s
UI, page for page, as a plain React app with no backend. It started life as an
information architecture (iA) experiment; it now mirrors Lightning 1:1 so it can
be cross-referenced with the behaviour audit in Lightning's `annotations/`
folder and then wired up to the real backend.

- Every route is a Lightning URL. `src/App.tsx` lists them, each commented with
  its id from the audit's `annotations/INVENTORY.md`.
- Every page renders from static fixtures in `src/mock-data/`, modelled on
  Lightning's demo seed. Buttons that would talk to a server only change local
  state.
- The look is Lightning's own: its side menu, header, buttons, tables and
  modals, its `primary`/`secondary` colour names and its `hero-*` icon classes.
  The Style Picker (bottom right) can re-skin it; Lightning v2 is the default.

## Running it

```bash
npm install
npm run dev              # the app
npm run storybook        # the component library on :6006
npm run build            # typecheck and build
npm run lint
```

The app uses hash routing, so a page's address looks like
`/#/projects/<project-id>/history`.

## Signing in

The app opens signed in as Amy (demo@openfn.org, a superuser), so almost any
link works straight away: dhis2-project requires MFA, which Amy hasn't set up. To see the login page, go to `/#/users/log_out`.

| Email | Who | Password | MFA code |
| --- | --- | --- | --- |
| demo@openfn.org | Amy, superuser | `welcome12345` | |
| editor@openfn.org | Esther | `welcome12345` | |
| viewer@openfn.org | Vikram | `welcome12345` | |
| super@openfn.org | Sizwe, superuser | `welcome12345` | `123456`, or the backup code `fakebackup01` |

Signing in as someone else shows their projects and what they may do there.
dhis2-project requires MFA, so only Sizwe opens it; Amy and Esther are sent
to set up MFA.
You stay signed in across reloads: the pretend server (`src/fake-api/`) keeps
the session in the browser's localStorage. Clear it to start again as Amy.

See [CLAUDE.md](./CLAUDE.md) for how the code is organised and where the rules
for adding pages and components are.
