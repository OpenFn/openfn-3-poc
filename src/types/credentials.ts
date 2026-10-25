/** Credentials, OAuth clients and keychain credentials: the replica's model, then the credential index's contract. Types only: no data, no behaviour. */

export type TransferStatus = "pending" | "completed" | null;

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

/**
 * One field of an adaptor's credential schema, as JsonSchemaBodyComponent
 * draws it (`input_type`): text; password (`writeOnly`); url (`format: uri`);
 * integer, typed as text and saved as a number; boolean, a checkbox saved as
 * true or false; object, a code area saved as the JSON it holds. Any other
 * type (number, array, one Lightning doesn't know) arrives as "text".
 */
export interface SchemaField {
  key: string;
  label: string;
  kind: "text" | "password" | "url" | "integer" | "boolean" | "object";
  required: boolean;
  placeholder: string | null;
  /** The schema's type when Lightning doesn't recognise it (`Credentials.Schema.warning`); the form warns that it's stored as text. */
  unrecognizedType: string | null;
}

// ---------------------------------------------------------------------------
// The credential index's contract, written by hand and shared by the user's
// Credentials page (CredentialsIndexPageProps) and project settings'
// Credentials tab (CredentialsSettings). Hosts send these; the replica maps
// the model above onto them.

/** A project a credential or OAuth client is shared with, or can be. */
export interface CredentialProjectRef {
  id: string;
  name: string;
}

/** A project a credential is shared with. */
export interface CredentialProjectAccess extends CredentialProjectRef {
  /** The project's workflows with a job using the credential, by name; removing the project from the credential asks first when there are any. */
  workflowsUsing: string[];
}

/** An OAuth credential's own client, with what its edit form needs, sent even when the client isn't shared where the credential is. */
export interface CredentialOauthClient {
  id: string;
  name: string;
  mandatoryScopes: string[];
  optionalScopes: string[];
  scopesDocUrl: string;
}

export interface CredentialRef {
  id: string;
  name: string;
}

/** A row of the Credentials table. */
export interface CredentialRow {
  id: string;
  name: string;
  /** Adaptor short name ("dhis2"), "raw" or "oauth". */
  schema: string;
  /** For schema "oauth": its client, or null when the client was deleted ("OAuth client not found"). null for any other schema. */
  oauthClient: CredentialOauthClient | null;
  ownerEmail: string;
  /** Every project it's shared with, including ones the viewer can't see or share with: saving `projectIds` replaces the list, so one left out is unshared. */
  projects: CredentialProjectAccess[];
  externalId: string | null;
  /** Environment names ("main", "staging"); the table shows how many. */
  environments: string[];
  transferStatus: TransferStatus;
  /** When the credential was scheduled for deletion, or null. Deleting a scheduled credential deletes it now. */
  scheduledDeletion: string | null;
  /** Used in runs still in a project's audit trail: the deletion modal says so, and a scheduled one can't be deleted now. */
  hasActivityInProjects: boolean;
  /** The viewer owns it: transfer, edit and delete. */
  canEdit: boolean;
}

/** A row of the OAuth Clients table, with what its edit form shows. The client id and secret come from `onLoadOauthClientSecrets`. */
export interface OauthClientRow {
  id: string;
  name: string;
  ownerEmail: string;
  /** Usable by every project on the instance; shown as GLOBAL. */
  global: boolean;
  projects: CredentialProjectRef[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
  introspectionEndpoint: string;
  userinfoEndpoint: string;
  mandatoryScopes: string[];
  optionalScopes: string[];
  scopesDocUrl: string;
  /** The viewer owns it: edit and delete. */
  canEdit: boolean;
}

/** A row of the Keychain Credentials table (project settings only). */
export interface KeychainCredentialRow {
  id: string;
  name: string;
  /** JSONPath that picks the credential selector out of the run's input. */
  path: string;
  defaultCredential: CredentialRef | null;
  /** Who created it. */
  ownerEmail: string;
}

/** An adaptor offered by "Add a credential". Its fields come from `onLoadCredentialSchema` once it's picked; the page adds Raw JSON and the OAuth clients. */
export interface CredentialTypeOption {
  /** Schema key ("dhis2"). */
  key: string;
  /** Shown next to the radio. */
  name: string;
}

/** The host's answer to `onLoadCredentialSchema`. */
export interface CredentialSchemaResult {
  fields: SchemaField[];
}

/** Who signed in with an OAuth provider, when the client has a userinfo endpoint and it answered. */
export interface OauthUserInfo {
  name: string | null;
  email: string | null;
}

/** What an environment's stored OAuth token grants. No token values: the host keeps those. */
export interface StoredOauthToken {
  /** The scopes it was granted; the form ticks them again. */
  scopes: string[];
  /**
   * "ready" once the host has checked it. A host that refreshed an expired
   * token saves the new one before it answers, as
   * `Credentials.resolve_credential_body` does. "unavailable" when the provider couldn't be
   * reached or turned the refresh away for now (rate limited, down); the
   * stored token is kept. "reauthorize" when the refresh was refused or the
   * token revoked.
   */
  status: "ready" | "unavailable" | "reauthorize";
  userInfo: OauthUserInfo | null;
}

/** One stored environment, in the host's answer to `onLoadCredentialSecrets`. */
export interface CredentialEnvironmentSecrets {
  name: string;
  /** The body as JSON text; "" for OAuth. */
  body: string;
  /** For an OAuth credential, its token; otherwise null. */
  oauth: StoredOauthToken | null;
}

/** The host's answer to `onLoadCredentialSecrets`: the stored values, for the edit form. */
export interface CredentialSecretsResult {
  environments: CredentialEnvironmentSecrets[];
}

/** One environment, as the credential form saves it. */
export interface CredentialEnvironmentValues {
  name: string;
  /**
   * The stored name it was loaded with (different when renamed), or null for
   * a new environment. The host moves the stored body and token to `name`,
   * looking every `previousName` up in what was stored before this save:
   * renames can swap or cycle names (main→tmp, staging→main, tmp→staging).
   */
  previousName: string | null;
  /** The body as JSON text; "" for OAuth. */
  body: string;
  /** For OAuth: the sign-in from this form whose token this environment takes, or null to keep the token stored under `previousName`. */
  signInId: string | null;
}

/** What the credential form saves. Every environment is sent; a stored one left out is deleted. */
export interface CredentialValues {
  /** The form this came from; the one its sign-ins were started with. */
  formId: string;
  name: string;
  /** "" for none. */
  externalId: string;
  /** Adaptor short name, "raw" or "oauth". */
  schema: string;
  /** The client, for schema "oauth"; otherwise null. */
  oauthClientId: string | null;
  projectIds: string[];
  environments: CredentialEnvironmentValues[];
}

/** What the OAuth client form saves. */
export interface OauthClientValues {
  name: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint: string;
  introspectionEndpoint: string;
  userinfoEndpoint: string;
  clientId: string;
  clientSecret: string;
  mandatoryScopes: string[];
  optionalScopes: string[];
  scopesDocUrl: string;
  global: boolean;
  /** Empty for a global client. */
  projectIds: string[];
}

/** The host's answer to `onLoadOauthClientSecrets`, for the edit form. */
export interface OauthClientSecretsResult {
  clientId: string;
  clientSecret: string;
}

export interface KeychainCredentialValues {
  name: string;
  path: string;
  defaultCredentialId: string | null;
}

/** What "Sign in with …" asks the host for. */
export interface OauthAuthorizeValues {
  /** The open credential form, which a token from this sign-in may only be saved by. */
  formId: string;
  /** This attempt, unique on the page (the form id, the environment and a count). `oauthSignIns` answers with it and save names it. */
  signInId: string;
  /** The credential being edited, or null for a new one. */
  credentialId: string | null;
  oauthClientId: string;
  /** The mandatory scopes and the optional ones the user ticked. */
  scopes: string[];
  /**
   * The environment's name when the sign-in started, for display only: the
   * user may rename it before saving, and the save names the environment
   * (`signInId` on it) the token is for. Each environment signs in separately.
   */
  environment: string;
}

/** The host's answer to `onAuthorizeOauth`: the provider's sign-in page, which the page opens in a popup. */
export interface OauthAuthorizeResult {
  authorizeUrl: string;
}

/**
 * How one sign-in ended, sent as data once the provider has redirected back
 * to the host. The host keeps the token; only who signed in reaches the page.
 */
export interface OauthSignInResult {
  signInId: string;
  /** null when it worked; otherwise what went wrong, shown with "Try again". */
  error: string | null;
  userInfo: OauthUserInfo | null;
}

/** What the shared credential index shows, on both pages. */
export interface CredentialIndexData {
  /** The viewer's own (user page) or those shared with the project (settings), sorted by name. */
  credentials: CredentialRow[];
  /** The viewer's own or the project's, plus the global ones, sorted by name. */
  oauthClients: OauthClientRow[];
  /** Projects the viewer can share a credential or client with. */
  projects: CredentialProjectRef[];
  credentialTypes: CredentialTypeOption[];
  /**
   * How each sign-in started on this page ended, oldest first. The host may
   * drop a form's answers once that form saves or `onDiscardOauthSignIns`
   * names it, not before.
   */
  oauthSignIns: OauthSignInResult[];
  /** Superusers may make an OAuth client global. */
  canCreateGlobalOauthClient: boolean;
}

/**
 * The credential index's actions, on both pages. Each resolves once the host
 * has answered; the host announces success (its flash), and a rejection
 * (field errors or a message) stays in the open modal.
 *
 * OAuth tokens never reach the page. The host keeps each sign-in's token
 * under its `signInId`, with the `formId`, `credentialId` and
 * `oauthClientId` it was started with, for this page (one browser session)
 * and the signed-in user only. On save, an OAuth environment with a `signInId` takes that token.
 * The host refuses a sign-in started by another form, for another
 * credential or with another client, one it doesn't know (another page's,
 * or used already), and one named by two environments. An environment
 * without a `signInId` keeps the token stored under its `previousName`; one
 * with no stored token there (a new environment, or a name that isn't
 * stored) is refused. The host drops a form's unused tokens when the form
 * saves, `onDiscardOauthSignIns` names it, or the page goes.
 */
export interface CredentialActions {
  /**
   * Rejects with field errors or a message, which the form shows: `name`,
   * `externalId`, or `environments.<name>` for one environment.
   */
  onCreateCredential: (values: CredentialValues) => Promise<void>;
  onUpdateCredential: (id: string, values: CredentialValues) => Promise<void>;
  /** The stored environments, fetched when Edit is chosen, so secrets never sit in the page's props. */
  onLoadCredentialSecrets: (id: string) => Promise<CredentialSecretsResult>;
  /** An adaptor's form fields, fetched when it's picked (or its credential is edited). */
  onLoadCredentialSchema: (key: string) => Promise<CredentialSchemaResult>;
  /**
   * Schedules the deletion, or with `now` deletes it for good: what the dialog
   * showed when it opened, even if the credential was scheduled or restored
   * since. Scheduling one that is already scheduled moves its date. A
   * credential with activity in projects can't be deleted now.
   */
  onDeleteCredential: (id: string, intent: { now: boolean }) => Promise<void>;
  onCancelCredentialDeletion: (id: string) => Promise<void>;
  /**
   * Rejects with field errors on `receiverEmail`: no such user, the viewer
   * themself, or someone who isn't a member of every project using the credential.
   */
  onTransferCredential: (id: string, receiverEmail: string) => Promise<void>;
  onRevokeCredentialTransfer: (id: string) => Promise<void>;
  /** Starts a sign-in; how it ended comes back in `oauthSignIns`. */
  onAuthorizeOauth: (values: OauthAuthorizeValues) => Promise<OauthAuthorizeResult>;
  /** A credential form that started a sign-in has closed, saved or not: drop its sign-ins' unused tokens (after a save there are none left). Nothing waits on it. */
  onDiscardOauthSignIns: (formId: string) => Promise<void>;
  /** This and `onUpdateOauthClient` reject with field errors keyed by `OauthClientValues`' property names, or a message. */
  onCreateOauthClient: (values: OauthClientValues) => Promise<void>;
  onUpdateOauthClient: (id: string, values: OauthClientValues) => Promise<void>;
  onLoadOauthClientSecrets: (id: string) => Promise<OauthClientSecretsResult>;
  onDeleteOauthClient: (id: string) => Promise<void>;
}

/**
 * Keychain credentials' actions: project settings only. Create and update
 * reject with field errors keyed by `KeychainCredentialValues`' property
 * names, or a message.
 */
export interface KeychainCredentialActions {
  onCreateKeychainCredential: (values: KeychainCredentialValues) => Promise<void>;
  onUpdateKeychainCredential: (id: string, values: KeychainCredentialValues) => Promise<void>;
  onDeleteKeychainCredential: (id: string) => Promise<void>;
}
