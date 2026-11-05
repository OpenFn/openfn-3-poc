/**
 * URLs Lightning builds from the instance's own address. The host is fixed
 * here; once wired it comes from the instance config.
 */
import type { AuthProvider } from "@/types/admin";

/** Base URL the proxy URLs hang off (`LightningWeb.Endpoint.url()`). */
export const channelProxyBase = "https://app.openfn.org";

export function channelProxyUrl(channelId: string): string {
  return `${channelProxyBase}/channels/${channelId}`;
}

/** The webhook URL Lightning shows for a trigger. */
export function webhookUrl(triggerId: string): string {
  return `https://app.openfn.org/i/${triggerId}`;
}

export function authRedirectUri(provider: Pick<AuthProvider, "redirectHost" | "name">): string {
  return `${provider.redirectHost.replace(/\/$/, "")}/authenticate/${provider.name}/callback`;
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
