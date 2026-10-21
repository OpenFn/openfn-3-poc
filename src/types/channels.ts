/** Channels (the HTTP proxy) and the requests made through them. Types only: no data, no behaviour. */

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  destinationUrl: string;
  /** Project credential used to authenticate with the destination. */
  destinationCredentialId: string | null;
  /** Webhook auth methods clients use to call the channel. */
  clientAuthMethodIds: string[];
  requestCount: number;
  lastActivityAt: string | null;
  /** Bumped on every save; channel requests record the version they ran against. */
  lockVersion: number;
}

/** One row of the channels index table: what it shows, with the links the host builds. */
export interface ChannelRow {
  id: string;
  name: string;
  enabled: boolean;
  destinationUrl: string;
  /** The URL client systems call; the host knows its own address. */
  proxyUrl: string;
  requestCount: number;
  lastActivityAt: string | null;
  /** The channel logs, filtered to this channel. */
  logsHref: string;
}

/** What the New / Edit Channel form edits and saves. */
export interface ChannelFormValues {
  name: string;
  enabled: boolean;
  destinationUrl: string;
  /** A project credential id, or "" for none. */
  destinationCredentialId: string;
  /** Webhook auth method ids. */
  clientAuthMethodIds: string[];
}

/** What the form needs from the host: the options, and the channel when editing. */
export interface ChannelForm {
  channel?: (ChannelFormValues & { id: string; proxyUrl: string }) | undefined;
  /** The project's credentials (Destination Credential). */
  credentialOptions: { id: string; name: string }[];
  /** The project's webhook auth methods (Client Credentials). */
  authMethodOptions: { id: string; name: string }[];
}

export type ChannelRequestState = "pending" | "success" | "failed" | "timeout" | "error";

export interface ChannelEvent {
  type: "destination_response" | "error";
  requestMethod: string;
  requestPath: string;
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

export interface ChannelRequest {
  id: string;
  /** The client-facing request id (shown in the table). */
  requestId: string;
  channelId: string;
  projectId: string;
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
