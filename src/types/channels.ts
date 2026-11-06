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

export interface ChannelEvent {
  type: "destination_response" | "error";
  /** Null on a wiped request. */
  requestMethod: string | null;
  requestPath: string | null;
  requestQueryString: string | null;
  requestHeaders: [string, string][] | null;
  requestBodyPreview: string | null;
  requestBodySize: number | null;
  requestBodyHash: string | null;
  responseStatus: number | null;
  responseHeaders: [string, string][] | null;
  responseBodyPreview: string | null;
  responseBodySize: number | null;
  responseBodyHash: string | null;
  /** Microseconds. */
  latencyUs: number | null;
  ttfbUs: number | null;
  queueUs: number | null;
  connectUs: number | null;
  requestSendUs: number | null;
  responseDurationUs: number | null;
  reusedConnection: boolean;
  errorMessage: string | null;
}

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

/** What the channel request page shows of a request: the host sends no other id, and only the primary event. */
export interface ChannelRequestDetail {
  id: string;
  state: ChannelRequestState;
  startedAt: string;
  completedAt: string | null;
  clientIdentity: string | null;
  clientAuth: string;
  destinationAuth: string;
  isWiped: boolean;
  /** The channel's config as it was when the request ran. */
  snapshot: { name: string; destinationUrl: string; lockVersion: number };
  events: ChannelEvent[];
}

/** The channel a request ran through, as the request page shows it: its current name, destination and version. */
export interface ChannelRequestChannel {
  id: string;
  projectId: string;
  name: string;
  destinationUrl: string;
  /** Bumped on every save; channel requests record the version they ran against. */
  lockVersion: number;
}
