import type { Meta, StoryObj } from "@storybook/react";
import CredentialFormModal from "./CredentialFormModal";
import OauthClientFormModal from "./OauthClientFormModal";
import KeychainCredentialFormModal from "./KeychainCredentialFormModal";
import TransferCredentialModal from "./TransferCredentialModal";
import CredentialDeletionModal from "./CredentialDeletionModal";
import ConfirmModal from "../primitives/ConfirmModal";
import { deleteKeychainMessage, deleteOauthClientMessage } from "./messages";
import { clientSecretsFor, fieldsForSchema, credentialIndexDataFor, credentialSecretsFor, credentialTypes, credentialsFixture, keychainRowsFor } from "../../mock-data/credentials";
import { projects } from "../../mock-data/projects";
import { users } from "../../mock-data/users";
import type { CredentialSecretsResult, StoredOauthToken } from "../../types/credentials";
import { RequestError } from "../../utils/errors";

const meta: Meta = { title: "Credentials/Modals" };
export default meta;
type Story = StoryObj;

const noop = () => {};
const save = async () => {};

const fixture = credentialsFixture();
// Every user's view, so each fixture record has a row whoever owns it.
const views = users.map((u) => credentialIndexDataFor(fixture, undefined, u));
const credentials = fixture.credentials.map((c) => views.flatMap((v) => v.credentials).find((row) => row.id === c.id)!);
const oauthClients = fixture.oauthClients.map((c) => views.flatMap((v) => v.oauthClients).find((row) => row.id === c.id)!);
const keychainCredentials = keychainRowsFor(fixture, projects[0]!);
const projectRefs = projects.map((p) => ({ id: p.id, name: p.name }));
const credentialForm = {
  oauthClients,
  credentialTypes,
  projects: projectRefs,
  oauthSignIns: [],
  onLoadCredentialSchema: async (key: string) => ({ fields: fieldsForSchema(key) }),
  onAuthorizeOauth: async () => ({ authorizeUrl: "about:blank" }),
  onDiscardOauthSignIns: async () => {},
  onSave: save,
};
const secretsOf = (i: number) => credentialSecretsFor(fixture, fixture.credentials[i]!);

export const NewCredential: Story = {
  render: () => <CredentialFormModal open onClose={noop} {...credentialForm} />,
};
export const EditCredential: Story = {
  render: () => <CredentialFormModal open onClose={noop} credential={credentials[1]!} secrets={secretsOf(1)} schema={{ fields: fieldsForSchema(credentials[1]!.schema) }} {...credentialForm} />,
};
export const EditOauthCredential: Story = {
  render: () => <CredentialFormModal open onClose={noop} credential={credentials[2]!} secrets={secretsOf(2)} {...credentialForm} />,
};
export const NewOauthClient: Story = {
  render: () => <OauthClientFormModal open onClose={noop} allowGlobal projects={projectRefs} onSave={save} />,
};
export const EditOauthClient: Story = {
  render: () => <OauthClientFormModal open onClose={noop} client={oauthClients[0]!} secrets={clientSecretsFor(fixture, oauthClients[0]!.id)} allowGlobal projects={projectRefs} onSave={save} />,
};
export const NewKeychainCredential: Story = {
  render: () => <KeychainCredentialFormModal open onClose={noop} credentials={credentials} onSave={save} />,
};
export const EditKeychainCredential: Story = {
  render: () => (
    <KeychainCredentialFormModal open onClose={noop} keychainCredential={keychainCredentials[0]!} credentials={credentials} onSave={save} />
  ),
};
export const TransferCredential: Story = {
  render: () => <TransferCredentialModal open onClose={noop} credential={credentials[0]!} onTransfer={save} onRevoke={save} />,
};
export const RevokeTransfer: Story = {
  render: () => <TransferCredentialModal open onClose={noop} credential={credentials[2]!} onTransfer={save} onRevoke={save} />,
};
export const DeleteCredential: Story = {
  render: () => <CredentialDeletionModal onClose={noop} credential={{ ...credentials[0]!, hasActivityInProjects: true }} onDelete={save} />,
};
export const CredentialMarkedForDeletion: Story = {
  render: () => <CredentialDeletionModal onClose={noop} credential={{ ...credentials[4]!, hasActivityInProjects: true }} onDelete={save} />,
};
export const DeleteOauthClient: Story = {
  render: () => (
    <ConfirmModal open onClose={noop} onConfirm={noop} title="Delete Oauth Client" tone="danger" confirmLabel="Delete">
      <p>{deleteOauthClientMessage(oauthClients[0]!.name)}</p>
      <p>Do you want to proceed with this action?</p>
    </ConfirmModal>
  ),
};
export const DeleteKeychainCredential: Story = {
  render: () => (
    <ConfirmModal open onClose={noop} onConfirm={noop} title="Delete Keychain Credential" tone="danger" confirmLabel="Delete">
      <p>{deleteKeychainMessage(keychainCredentials[0]!.name)}</p>
      <p>Do you want to proceed with this action?</p>
    </ConfirmModal>
  ),
};

const tick = () => new Promise((r) => setTimeout(r));
const submit: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};
const refused = () => Promise.reject(new Error("The server could not complete that request."));

/** The OAuth credential with every stored token changed as `patch` says. */
const oauthSecrets = (patch: Partial<StoredOauthToken>): CredentialSecretsResult => ({
  environments: secretsOf(2).environments.map((e) => ({ ...e, oauth: e.oauth && { ...e.oauth, ...patch } })),
});
const editOauth = (secrets: CredentialSecretsResult, credential = credentials[2]!) => (
  <CredentialFormModal open onClose={noop} credential={credential} secrets={secrets} {...credentialForm} />
);

/** Signed in, with who signed in. */
export const OauthSignedIn: Story = {
  render: () => editOauth(oauthSecrets({ userInfo: { name: "Amy Admin", email: "amy@openfn.org" } })),
};
/** The ticked permissions differ from the token's: Save waits until it's signed in again. */
export const OauthScopesChanged: Story = { render: () => editOauth(oauthSecrets({ scopes: [] })) };
export const OauthReauthorize: Story = { render: () => editOauth(oauthSecrets({ status: "reauthorize" })) };
export const OauthUnavailable: Story = { render: () => editOauth(oauthSecrets({ status: "unavailable" })) };
export const OauthClientNotFound: Story = {
  render: () => editOauth(secretsOf(2), { ...credentials[2]!, oauthClient: null }),
};
/** The host refuses one environment: the message shows on that environment and above the tabs. */
export const EnvironmentRefused: Story = {
  render: () => (
    <CredentialFormModal
      open
      onClose={noop}
      credential={credentials[1]!}
      secrets={secretsOf(1)}
      schema={{ fields: fieldsForSchema(credentials[1]!.schema) }}
      {...credentialForm}
      onSave={() =>
        Promise.reject(
          new RequestError("Invalid credential", {
            fieldErrors: { [`environments.${secretsOf(1).environments[0]!.name}`]: ["name has already been taken"] },
          })
        )
      }
    />
  ),
  play: submit,
};
export const SaveFailed: Story = {
  render: () => (
    <CredentialFormModal
      open
      onClose={noop}
      credential={credentials[1]!}
      secrets={secretsOf(1)}
      schema={{ fields: fieldsForSchema(credentials[1]!.schema) }}
      {...credentialForm}
      onSave={refused}
    />
  ),
  play: submit,
};
export const TransferFailed: Story = {
  render: () => <TransferCredentialModal open onClose={noop} credential={credentials[0]!} onTransfer={refused} onRevoke={save} />,
  play: async (context) => {
    const input = context.canvasElement.ownerDocument.querySelector<HTMLInputElement>("#receiver_email")!;
    // Set the value the way a keystroke does, so React's onChange sees it.
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, "someone@example.org");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await tick();
    await submit(context);
  },
};
