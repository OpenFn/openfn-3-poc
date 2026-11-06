/** Channels (the HTTP proxy) and the requests made through them, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { ChannelRequestState } from "@/types/channels";

export interface Channel {
  id: string;
  projectId: string;
  name: string;
  enabled: boolean;
  destinationUrl: string;
  /** A credential linked to the project, used to sign in to the destination. */
  destinationCredentialId: string | null;
  /** Webhook auth methods clients use to call the channel. */
  clientAuthMethodIds: string[];
  requestCount: number;
  lastActivityAt: string | null;
  /** Bumped on every save; channel requests record the version they ran against. */
  lockVersion: number;
}

export interface ChannelEvent {
  type: "destination_response" | "error";
  requestMethod: string;
  /** Null on a wiped request, with the query string, headers and bodies. */
  requestPath: string | null;
  requestQueryString: string | null;
  requestHeaders: [string, string][] | null;
  requestBodyPreview: string | null;
  requestBodySize: number | null;
  responseStatus: number | null;
  responseHeaders: [string, string][] | null;
  responseBodyPreview: string | null;
  responseBodySize: number | null;
  /** Microseconds. */
  latencyUs: number | null;
  ttfbUs: number | null;
  queueUs: number | null;
  connectUs: number | null;
  requestSendUs: number | null;
  responseDurationUs: number | null;
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
  /** Lightning's columns: how the client signed in, the webhook auth method it matched, and the destination credential. */
  clientAuthType: "api" | "basic" | null;
  clientWebhookAuthMethodId: string | null;
  destinationCredentialId: string | null;
  isWiped: boolean;
  /** The channel's config as it was when the request ran. */
  snapshot: { name: string; destinationUrl: string; lockVersion: number };
  events: ChannelEvent[];
}
