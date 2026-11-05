---
paths:
  - 'src/api/**'
  - 'src/fake-api/**'
  - 'src/**/*.route.tsx'
  - 'src/**/*.replica.tsx'
  - 'src/pages/**/*.route.tsx'
  - 'src/**/*Replica.ts'
---

# The API and the wrappers that call it

PRINCIPLES.md "How data flows" says what; this is how.
At the moment the app supports us moving to Lightning as a single page React app with API or connecting up the existing backend with React islands. This document talks about the api side of things.

## `src/api/`

- `client.ts` is the only file that calls `fetch`. `request(method, path, body)`
  goes to Lightning through the Vite `/api` proxy with `VITE_API=lightning`,
  or otherwise to `fakeFetch` from `src/fake-api/`. `listAll(path, key)`
  follows `links.next` to the end.
- `src/fake-api/` is a pretend server, not part of the data code: it answers
  each route as api/ says Lightning would (status, JSON body, problem
  document), with the fixtures as its database. Only `client.ts` imports it
  (lint), so resource files know nothing about it and going real is deleting
  the folder and that import. A new route the app calls gets an answer there.
- `isApiError(error, "step_up_required")` is how a route spots a refusal.
  `ApiProvider` holds TanStack Query: a failed load is retried, a 4xx never.
  Only `src/api/` imports TanStack Query, and only routes, replicas,
  `main.tsx`, stories and tests import `src/api/` (lint).
- A refused request throws `ApiError`. Show its `message` (the server's
  `detail`); branch on `code`, never on the words. Body errors arrive
  as `fieldErrors`, ready for the form.
- One file per resource (`credentials.ts`, `projects.ts`, …), holding, in
  this order: the API's type (`ApiCredential`, snake_case as sent), the mapper
  to the page's props type (a plain function), the query keys, the
  queries and the saves.
- Query keys go from general to specific, all from that file:
  `["credentials"]`, `["projects", id, "members"]`.
- No UI here: no components, no toasts (lint).
- In tests and stories, `failNext("POST /api/me/tokens", { status, code, detail })`
  makes that route's next request fail, and `resetFakeApi()` puts the fake
  server's data back. The fake user's password and MFA code are
  `FAKE_PASSWORD` and `FAKE_MFA_CODE`; `stepUp` (session.ts) with either
  steps the session up for five minutes.
- `src/pages/profile/tokens/TokensPage.route.tsx` and `TokensPage.route.test.tsx` are
  the worked example.

## The wrapper

- Loads with `useQuery`, maps the answer with the resource's mapper, and
  passes the page its usual props plus `status`. Independent queries run side
  by side, never one after another.
- `status` comes from the query: loading while there's no data, `notFound` /
  `forbidden` from the `ApiError` code, otherwise `error` with its message.
  The page draws it with `AsyncBoundary`. A refetch keeps the old rows on
  screen.
- A save is a `useMutation` whose `onSuccess` returns the invalidation of
  every key the save changed. The page's `on*` gets `mutateAsync`, so it
  resolves once the lists have reloaded and rejects with the `ApiError` the
  form shows (STANDARDS pattern 1).
- Never `setQueryData` (lint): the server's answer comes back through the
  refetch. Show a change early only where the page already uses
  `useChosenValue`.
- A success toast is the wrapper's, after the save resolves, in Lightning's
  flash wording. An error toast is the page's, for an action with no form
  (`useAction(handler, { onError: "toast" })`, STANDARDS pattern 1); it
  stays until dismissed. Nothing in `src/api/` toasts.
- The page's props and action types don't change to suit the API. A new
  thing is an optional prop, so Lightning's LiveView wrapper keeps compiling.
  If a page needs a prop changed, stop and ask.
- What the API can't give a page yet is mapped to the answer for "none" and
  tracked as a finding, not faked in the page.
