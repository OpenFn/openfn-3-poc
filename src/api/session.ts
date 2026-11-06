/** The signed-in session on Lightning's API (api/account.md: Get the instance, Sessions, Get the current user). */
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import type { SsoProvider } from "@/types/auth";
import type { BasicInfoValues, ChangeEmailValues, ChangePasswordValues, ProfilePageData } from "@/types/profile";
import type { ResourceStatus } from "@/types/resource";
import type { Session, User } from "@/types/users";
import { isSignedOut, request, statusOf } from "./client";

/** `GET` and `POST /api/session`'s `data`. */
export interface ApiSession {
  state: "signed_in" | "mfa_required" | "confirmation_required" | "signup_pending";
  user_id: string;
  /** When the step-up ends, or null when the session isn't stepped up. */
  stepped_up_until: string | null;
  csrf_token: string;
  pending_signup: { email: string; first_name: string; last_name: string } | null;
}

/** `GET /api/me`: the user object with what a session token adds. */
export interface ApiMe {
  id: string;
  attributes: {
    email: string;
    first_name: string;
    last_name: string;
    role: User["role"];
    support_user: boolean;
    disabled: boolean;
    scheduled_deletion: string | null;
    has_activity_in_projects: boolean;
    mfa_enabled: boolean;
    inserted_at: string;
    confirmed_at: string | null;
    contact_preference: User["contactPreference"];
    experimental_features: boolean;
    github: { connected: boolean; expires_at: string | null };
  };
}

/** `GET /api/instance`'s `data`, the fields the app reads. */
export interface ApiInstance {
  allow_signup: boolean;
  release: { label: string };
  /** Null without a session token. */
  admin_email: string | null;
  sign_in_providers: { name: string; kind: "social" | "external"; start_url: string }[];
  /** Where to connect a GitHub account, or null when GitHub sync isn't set up. */
  github_connect_url: string | null;
  /** How many days a deleted project is kept before it's purged. */
  purge_deleted_after_days: number;
}

export function userFromMe({ id, attributes: a }: ApiMe): User {
  return {
    id,
    firstName: a.first_name,
    lastName: a.last_name,
    email: a.email,
    role: a.role,
    confirmedAt: a.confirmed_at,
    insertedAt: a.inserted_at,
    mfaEnabled: a.mfa_enabled,
    githubConnected: a.github.connected,
    experimentalFeatures: a.experimental_features,
    supportUser: a.support_user,
    disabled: a.disabled,
    scheduledDeletion: a.scheduled_deletion,
    contactPreference: a.contact_preference,
  };
}

/** The profile page's data: you, from `GET /api/me`, and where to connect GitHub, from `GET /api/instance`. */
export function profileOf({ id, attributes: a }: ApiMe, instance: ApiInstance): ProfilePageData {
  return {
    user: { id, firstName: a.first_name, lastName: a.last_name, email: a.email, contactPreference: a.contact_preference, insertedAt: a.inserted_at },
    mfa: { enabled: a.mfa_enabled },
    // A lapsed token: `expires_at` is kept but it no longer works.
    github: { connectHref: instance.github_connect_url, status: a.github.connected ? "connected" : a.github.expires_at ? "expired" : "none" },
    experimentalFeatures: a.experimental_features,
    deletion: {
      hasActivityInProjects: a.has_activity_in_projects,
      // Already scheduled, deleting goes ahead at once, which project activity blocks (UserDeletionModal).
      blocked: a.scheduled_deletion !== null && a.has_activity_in_projects,
    },
  };
}

/** What the login page offers: Register, and the first external provider (Lightning shows only one). */
export function signInOptions(instance: ApiInstance | undefined): { allowSignup: boolean; ssoProvider: SsoProvider | null } {
  const provider = instance?.sign_in_providers.find((p) => p.kind === "external");
  return { allowSignup: instance?.allow_signup ?? false, ssoProvider: provider ? { name: provider.name, handlerUrl: provider.start_url } : null };
}

/** Every key under this one is the signed-in person's; a 401 elsewhere reloads it (ApiProvider). */
export const sessionKeys = { all: ["session"] as const, me: ["session", "me"] as const, instance: ["instance"] as const };

const instanceQuery = queryOptions({
  queryKey: sessionKeys.instance,
  queryFn: () => request<{ data: ApiInstance }>("GET", "/api/instance").then((answer) => answer.data),
});

const meQuery = queryOptions({
  queryKey: sessionKeys.me,
  queryFn: () => request<{ data: ApiMe }>("GET", "/api/me").then((answer) => answer.data),
});

/** The instance's sign-in options, before anyone signs in, and where loading them stands. Nothing extra until they load. */
export function useSignInOptions(): { status: ResourceStatus; allowSignup: boolean; ssoProvider: SsoProvider | null } {
  const query = useQuery(instanceQuery);
  return { status: statusOf(query), ...signInOptions(query.data) };
}

/** How many days a deleted project is kept before it's purged, and where loading that stands. SessionGate has already loaded it. */
export function usePurgeDeletedAfterDays(): { status: ResourceStatus; days: number } {
  const query = useQuery({ ...instanceQuery, select: (instance) => instance.purge_deleted_after_days });
  return { status: statusOf(query), days: query.data ?? 0 };
}

/** The states the gate knows what to do with. Anything else (`signup_pending`) is shown as an error. */
type GateState = "signed_in" | "mfa_required" | "confirmation_required" | "signed_out";

/**
 * Who is signed in, for the gate. `state` is the session's, or `signed_out`
 * when Lightning answers 401; undefined while it loads. `session` is there
 * once signed in and the user and instance have loaded, the same object
 * until either changes.
 */
export function useSession(): { status: ResourceStatus; state: GateState | undefined; session: Session | undefined } {
  const session = useQuery({
    queryKey: sessionKeys.all,
    queryFn: () => request<{ data: ApiSession }>("GET", "/api/session").then((answer) => answer.data),
  });
  // Side by side with the session: /api/me answers 401 too when there isn't one, and then isn't asked for again.
  // `select` only maps again when the answer changes, so an unchanged answer keeps the same objects.
  const me = useQuery({ ...meQuery, select: userFromMe });
  const instance = useQuery(instanceQuery);
  const user = me.data;
  const info = instance.data;
  const value = useMemo(
    () => (user && info ? { user, instance: { adminEmail: info.admin_email ?? "", releaseLabel: info.release.label } } : undefined),
    [user, info]
  );

  if (isSignedOut(session.error)) return { status: { state: "ready" }, state: "signed_out", session: undefined };
  const state = session.data?.state;
  if (state === "signup_pending") {
    // ponytail: no sign-up page yet, so a provider's first sign-in can't go anywhere.
    return { status: { state: "error", message: "Signing up through a sign-in provider isn't available yet." }, state: undefined, session: undefined };
  }
  if (state && state !== "signed_in") return { status: { state: "ready" }, state, session: undefined };
  // Signed in, but the session ended before /api/me answered: signed out after all.
  if (isSignedOut(me.error)) return { status: { state: "ready" }, state: "signed_out", session: undefined };
  const failed = [session, me, instance].find((q) => q.error);
  const status = failed ? statusOf(failed) : state && value ? ({ state: "ready" } as const) : ({ state: "loading" } as const);
  return { status, state, session: state ? value : undefined };
}

/**
 * Sign in, the second step with an MFA code or a backup code, sign out, and
 * step up. Signing in or out drops every cached answer, the old person's.
 * Signing in rejects with 401 `invalid_credentials`, or `mfa_required` when
 * the account has MFA: then send the code with `verify`. Step-up rejects with
 * `invalid_credentials` for a wrong password or code.
 */
export function useSessionSaves() {
  const queryClient = useQueryClient();
  const fresh = () => queryClient.clear();
  const signIn = useMutation({
    mutationFn: async (values: { email: string; password: string }) => void (await request("POST", "/api/session", values)),
    onSuccess: fresh,
  });
  const verify = useMutation({
    mutationFn: async (code: { mfa_code: string } | { backup_code: string }) => void (await request("POST", "/api/session", code)),
    onSuccess: fresh,
  });
  const signOut = useMutation({ mutationFn: () => request<void>("DELETE", "/api/session"), onSuccess: fresh });
  const stepUpSave = useMutation({
    mutationFn: async (values: { password: string } | { mfaCode: string }) => void (await stepUp(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: sessionKeys.all }),
  });
  return { signIn: signIn.mutateAsync, verify: verify.mutateAsync, signOut: signOut.mutateAsync, stepUp: stepUpSave.mutateAsync };
}

/**
 * Enter the password or an MFA code again: steps the session up for five
 * minutes, which a few routes need (`step_up_required`). A wrong one rejects
 * with 401 `invalid_credentials`. Outside React (tests); a .query file uses
 * `useSessionSaves().stepUp`.
 */
export const stepUp = (values: { password: string } | { mfaCode: string }) =>
  request<{ data: ApiSession }>("POST", "/api/session", "password" in values ? { password: values.password } : { mfa_code: values.mfaCode }).then(
    (answer) => answer.data
  );

/** Your profile, and where loading it stands: loading until both answers are in, then the same object until either changes. */
export function useProfile(): { status: ResourceStatus; profile: ProfilePageData | undefined } {
  const me = useQuery(meQuery);
  const instance = useQuery(instanceQuery);
  const profile = useMemo(() => (me.data && instance.data ? profileOf(me.data, instance.data) : undefined), [me.data, instance.data]);
  return { status: statusOf({ data: profile, error: me.error ?? instance.error }), profile };
}

/**
 * Changing your own account (api/users.md, Update a user, planned for your own
 * id), given your id from `useProfile`. Each resolves once you have reloaded
 * and rejects with the `ApiError`. A new email or password steps the session
 * up with your current password first, so a wrong one rejects with
 * `invalid_credentials`; the new email waits for its link. Deleting signs you
 * out on the server.
 */
export function useAccountSaves(userId: string) {
  const queryClient = useQueryClient();
  const path = `/api/users/${encodeURIComponent(userId)}`;
  const reload = () => queryClient.invalidateQueries({ queryKey: sessionKeys.all });
  // Reloads even when refused, so a step-up just taken shows in `stepped_up_until`.
  const patch = useMutation({ mutationFn: (changes: object) => request("PATCH", path, changes), onSettled: reload });
  const withPassword = async (currentPassword: string, changes: object) => {
    await stepUp({ password: currentPassword });
    await patch.mutateAsync(changes);
  };
  const disconnectGithub = useMutation({ mutationFn: () => request<void>("DELETE", "/api/me/github_connection"), onSuccess: reload });
  const deleteAccount = useMutation({ mutationFn: () => request<void>("DELETE", path) });
  return {
    saveBasicInfo: async (values: BasicInfoValues) => void (await patch.mutateAsync(values)),
    changeEmail: ({ email, currentPassword }: ChangeEmailValues) => withPassword(currentPassword, { email }),
    changePassword: ({ password, currentPassword }: ChangePasswordValues) => withPassword(currentPassword, { password }),
    setExperimentalFeatures: async (on: boolean) => void (await patch.mutateAsync({ experimental_features: on })),
    disconnectGithub: () => disconnectGithub.mutateAsync(),
    deleteAccount: () => deleteAccount.mutateAsync(),
  };
}
