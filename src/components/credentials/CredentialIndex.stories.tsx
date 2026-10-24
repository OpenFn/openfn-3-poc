import type { Meta, StoryObj } from "@storybook/react";
import CredentialIndex from "./CredentialIndex";
import NewCredentialMenuButton from "./NewCredentialMenuButton";
import { projectCredentialMenuOptions } from "./credentialModalEvents";
import { clientSecretsFor, fieldsForSchema, credentialIndexDataFor, credentialSecretsFor, credentialsFixture, keychainRowsFor } from "../../mock-data/credentials";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withGrayPanel } from "../../stories/decorators";

const project = projects[0]!;
const fixture = credentialsFixture();
const done = async () => {};

const actions = {
  onCreateCredential: done,
  onUpdateCredential: done,
  onLoadCredentialSecrets: async (id: string) => credentialSecretsFor(fixture, fixture.credentials.find((c) => c.id === id)!),
  onLoadCredentialSchema: async (key: string) => ({ fields: fieldsForSchema(key) }),
  onDeleteCredential: done,
  onCancelCredentialDeletion: done,
  onTransferCredential: done,
  onRevokeCredentialTransfer: done,
  onAuthorizeOauth: async () => ({ authorizeUrl: "about:blank" }),
  onDiscardOauthSignIns: async () => {},
  onCreateOauthClient: done,
  onUpdateOauthClient: done,
  onLoadOauthClientSecrets: async (id: string) => clientSecretsFor(fixture, id),
  onDeleteOauthClient: done,
};

const projectScope = {
  id: project.id,
  keychainCredentials: keychainRowsFor(fixture, project),
  canCreateKeychainCredential: true,
  canEditKeychainCredential: true,
  onCreateKeychainCredential: done,
  onUpdateKeychainCredential: done,
  onDeleteKeychainCredential: done,
};

const meta: Meta<typeof CredentialIndex> = {
  title: "Credentials/CredentialIndex",
  component: CredentialIndex,
  decorators: [withGrayPanel],
  args: {
    ...credentialIndexDataFor(fixture, undefined, session.user),
    ...actions,
    project: null,
    canCreateProjectCredential: true,
    canCreateGlobalOauthClient: true,
  },
};
export default meta;
type Story = StoryObj<typeof CredentialIndex>;

/** /credentials: the signed-in user's own clients and credentials. */
export const UserCredentials: Story = {
  render: (args) => (
    <div className="space-y-4">
      <div className="flex justify-end"><NewCredentialMenuButton /></div>
      <CredentialIndex {...args} />
    </div>
  ),
};

const projectArgs = {
  ...credentialIndexDataFor(fixture, project, session.user),
  project: projectScope,
};

/** Project settings: owner column, keychains, project "Add new" options. */
export const ProjectCredentials: Story = {
  args: projectArgs,
  render: (args) => (
    <div className="space-y-4">
      <div className="flex justify-end"><NewCredentialMenuButton options={projectCredentialMenuOptions(true, true)} /></div>
      <CredentialIndex {...args} />
    </div>
  ),
};

/** A project viewer: no row actions on keychains, and creating is refused. */
export const ProjectViewer: Story = {
  args: {
    ...projectArgs,
    project: { ...projectScope, canCreateKeychainCredential: false, canEditKeychainCredential: false },
    canCreateProjectCredential: false,
  },
};

export const Empty: Story = { args: { credentials: [], oauthClients: [] } };
export const EmptyProject: Story = {
  args: { ...projectArgs, project: { ...projectScope, keychainCredentials: [] }, credentials: [], oauthClients: [] },
};
