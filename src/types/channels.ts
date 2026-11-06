/** Channels (the HTTP proxy) and the requests made through them. Types only: no data, no behaviour. */

/** One row of the channels index table, and the channel the form edits. */
export interface ChannelRow {
  id: string;
  name: string;
  enabled: boolean;
  destinationUrl: string;
  /** Where client systems send requests. */
  proxyUrl: string;
  requestCount: number;
  lastActivityAt: string | null;
  /** Webhook auth method ids a client must pass; none means anyone with the URL can use it. */
  clientAuthMethodIds: string[];
  /** A credential linked to the project, or null. */
  destinationCredentialId: string | null;
  /** Sent back with a save, so a change someone else made since is refused, not overwritten. */
  lockVersion: number;
}

/** What the New / Edit channel form saves, named as the API names it. */
export interface ChannelFormValues {
  name: string;
  destination_url: string;
  enabled: boolean;
  /** A credential linked to the project, or null for none. */
  destination_credential_id: string | null;
  /** The project's webhook auth methods a client must pass. */
  client_auth_method_ids: string[];
}

export type ChannelRequestState = "pending" | "success" | "failed" | "timeout" | "error";

/** One row of History's Channel Logs table: what it shows, with the path and error already picked from the events. */
export interface ChannelLogRow {
  id: string;
  /** The client-facing request id, shown short with the full one as the title. */
  requestId: string;
  channelId: string;
  channelName: string;
  startedAt: string;
  state: ChannelRequestState;
  /** The path of the request the destination answered; null when there was none or it was wiped. */
  requestPath: string | null;
  errorMessage: string | null;
}

/** One request through a channel, as its page shows it (`GET /api/channel_requests/:id`). */
export interface ChannelRequestDetail {
  id: string;
  /** The id clients and the destination see (`x-request-id`). */
  requestId: string;
  channelId: string;
  state: ChannelRequestState;
  startedAt: string;
  completedAt: string | null;
  /** The caller's address; null once wiped. */
  clientIdentity: string | null;
  /** `type` null: the channel was open. `methodName` null: the method has since been deleted. */
  clientAuth: { type: "api" | "basic" | null; methodId: string | null; methodName: string | null };
  /** Null when the channel had none; `name` null when it has since been deleted. */
  destinationCredential: { id: string; name: string | null } | null;
  /** The channel's config as it was when the request ran. */
  snapshot: { name: string; destinationUrl: string; lockVersion: number };
  /** Path, query string, headers and body are null once wiped. */
  request: {
    method: string;
    path: string | null;
    queryString: string | null;
    headers: [string, string][] | null;
    body: string | null;
    bodySize: number | null;
  } | null;
  /** Null when no response came back. */
  response: { status: number; headers: [string, string][] | null; body: string | null; bodySize: number | null } | null;
  errorMessage: string | null;
  /** `credential`: never sent. `transport`: no response came back. Null for an error the server doesn't know, or none. */
  errorCategory: "credential" | "transport" | null;
  /** Microseconds. */
  timing: {
    latencyUs: number | null;
    queueUs: number | null;
    connectUs: number | null;
    requestSendUs: number | null;
    ttfbUs: number | null;
    responseDurationUs: number | null;
  } | null;
  wiped: boolean;
}
