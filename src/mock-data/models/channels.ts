/** Channels (the HTTP proxy) and the requests made through them, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { ChannelEvent, ChannelRequestState } from "../../types/channels";

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
