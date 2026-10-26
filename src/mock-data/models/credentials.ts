/** Credentials, OAuth clients and keychain credentials, as the replica stores them. Its model, not the contract: pages take the hand-written shapes in src/types/ (STANDARDS §11). */
import type { TransferStatus } from "../../types/credentials";

export interface Credential {
  id: string;
  name: string;
  /** Adaptor short name ("dhis2"), "raw" or "oauth". */
  schema: string;
  ownerId: string;
  projectIds: string[];
  externalId: string | null;
  /** Environment names; Lightning defaults to a single "main". */
  environments: string[];
  /** Only for schema "oauth"; null means the client was deleted. */
  oauthClientId?: string | null;
  transferStatus: TransferStatus;
  /** ISO date the credential will be purged, when deletion is scheduled. */
  scheduledDeletion: string | null;
}

export interface OauthClient {
  id: string;
  name: string;
  ownerId: string;
  /** Global clients are usable by every project on the instance. */
  global: boolean;
  projectIds: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
  introspectionEndpoint: string;
  userinfoEndpoint: string;
  mandatoryScopes: string[];
  optionalScopes: string[];
  scopesDocUrl: string;
}

export interface KeychainCredential {
  id: string;
  name: string;
  /** JSONPath that picks the credential selector out of the run's input. */
  path: string;
  defaultCredentialId: string | null;
  projectId: string;
  createdById: string;
}
