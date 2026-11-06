/**
/**
 * URLs Lightning builds from the instance's own address, and the in-app
 * redirects around sign-in. The webhook host is fixed here; once wired it
 * comes from the instance config.
 */
import type { GateState } from "@/types/auth";

/** The webhook URL Lightning shows for a trigger. */
export function webhookUrl(triggerId: string): string {
  return `https://app.openfn.org/i/${triggerId}`;
}

/** Where a sign-in provider sends people back, from the instance's URL and the provider's name ("…" while it's blank). */
export function authRedirectUri(baseUrl: string, name: string): string {
  return `${baseUrl}/authenticate/${name || "…"}/callback`;
}

/** Whether a path is at `path` or below it: /profile/tokens/x is at /profile/tokens. */
export function isAt(pathname: string, path: string) {
  return pathname === path || pathname.startsWith(path + "/");
}

/**
 * Where to go next: the `return_to` path if it's one in this app, otherwise
 * `fallback`. A full URL, `//host` or `/\host` could send the person off the
 * site, so it's ignored.
 */
export function returnTo(params: URLSearchParams, fallback = "/projects"): string {
  const to = params.get("return_to");
  // Browsers read "/\host" as "//host" too.
  return to && /^\/(?![/\\])/.test(to) ? to : fallback;
}

/**
 * Where a session that hasn't finished signing in goes from `here` (path,
 * query and hash): log in or the MFA code, coming back after (`return_to`).
 */
export function signInRedirect(state: GateState | undefined, here: string): string | undefined {
  const query = new URLSearchParams({ return_to: here });
  if (state === "signed_out") return `/users/log_in?${query}`;
  if (state === "mfa_required") return `/users/two-factor?${query}`;
  return undefined;
}
