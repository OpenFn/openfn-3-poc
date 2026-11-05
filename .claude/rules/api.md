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
  the folder and that import. A new route the app calls gets an answer there,
  as api/ documents it, planned scope included (say so in a comment): the
  app is built for the new API. A list answers through `paged()`, so it pages
  like api/conventions.md; a write checks the body and answers one 422
  `invalid` listing every problem, as api/errors.md says.
- `isApiError(error, "step_up_required")` is how a route spots a refusal.
  `ApiProvider` holds TanStack Query: a failed load is retried, a 4xx never.
  Only `src/api/` imports TanStack Query, and only routes, replicas,
  `main.tsx`, stories and tests import `src/api/` (lint).
- A refused request throws `ApiError`. Show its `message` (the server's
  `detail`); branch on `code`, never on the words. Body errors arrive
  as `fieldErrors`, ready for the form. A form a route feeds names its fields
  as the API does (`name`, not `rawName`), so a 422 lands on its field with
  no mapping. The body's type lives in `src/types/` (`ProjectInput`), and the
  hook, the page's `on*` and the form's `useForm<…>` all use it, so a field
  renamed in one place breaks the build. The route test makes the save fail
  with a 422 on a field (`failNext`, pointer `#/name`) and checks the error
  shows under it; `CreateProjectModal` is the example.
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
- `src/pages/profile/tokens/TokensPage.route.tsx` and
  `src/pages/projects/dashboard/ProjectsDashboardPage.route.tsx` (a list on
  `ListPage`, with create), each with its `.route.test.tsx`, are the worked examples.

## The route

- Calls the resource's hooks (`useTokens()`, `useTokenSaves()` in
  `src/api/tokens.ts`) and passes the page what they return plus `status`.
  It never calls TanStack Query itself (lint). The hooks hold `useQuery`, the
  keys and the mapper, so two pages showing the same data load it the same
  way. Independent queries run side by side, never one after another.
- `status` comes from the query: loading while there's no data, `notFound` /
  `forbidden` from the `ApiError` code, otherwise `error` with its message.
  The page draws it with `AsyncBoundary`. A refetch keeps the old rows on
  screen.
- A save is a `useMutation` (in the resource's hook) whose `onSuccess` returns the invalidation of
  every key the save changed. The page's `on*` gets `mutateAsync`, so it
  resolves once the lists have reloaded and rejects with the `ApiError` the
  form shows (STANDARDS pattern 1).
- Never `setQueryData` (lint): the server's answer comes back through the
  refetch. Show a change early only where the page already uses
  `useChosenValue`.
- On a new or reworked page, the result shows where it happened
  (PRINCIPLES.md, When things go wrong). Otherwise a success toast is the page's, after the save resolves, in Lightning's
  flash wording (STANDARDS pattern 7). An error toast is the page's, for an action with no form
  (`useAction(handler, { onError: "toast" })`, STANDARDS pattern 1); it
  stays until dismissed. Nothing in `src/api/` toasts.
- The page's props and action types don't change to suit the API. A new
  prop may be required, so the build catches a route that forgets it.
  If a page needs an existing prop changed, stop and ask.
- What the API can't give a page yet, not even as planned scope, is mapped to the answer for "none" and
  tracked as a finding, not faked in the page.
