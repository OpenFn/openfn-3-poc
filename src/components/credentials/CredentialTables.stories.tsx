import type { Meta, StoryObj } from "@storybook/react";
import { CredentialsTable, KeychainCredentialsTable, OauthClientsTable } from "./CredentialTables";
import { EmptyState } from "../primitives/Table";
import Button from "../primitives/Button";
import { credentialIndexDataFor, credentialsFixture, keychainRowsFor } from "../../mock-data/credentials";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const meta: Meta = { title: "Credentials/CredentialTables" };
export default meta;
type Story = StoryObj;

const fixture = credentialsFixture();
const { credentials, oauthClients } = credentialIndexDataFor(fixture, projects[0]!, session.user);
const keychainCredentials = keychainRowsFor(fixture, projects[0]!);

const actions = () => (
  <Button variant="secondary" icon="hero-chevron-down" iconPosition="right">
    Actions
  </Button>
);

export const Credentials: Story = {
  render: () => <CredentialsTable rows={credentials} emptyState={null} actions={actions} />,
};
export const CredentialsWithOwner: Story = {
  render: () => <CredentialsTable rows={credentials} showOwner emptyState={null} actions={actions} />,
};
export const CredentialsEmpty: Story = {
  render: () => (
    <CredentialsTable
      rows={[]}
      emptyState={<EmptyState message="No credentials found." buttonText="Create a new Credential" onClick={() => {}} />}
    />
  ),
};
export const OauthClients: Story = {
  render: () => <OauthClientsTable rows={oauthClients} showOwner emptyState={null} actions={actions} />,
};
export const KeychainCredentials: Story = {
  render: () => <KeychainCredentialsTable rows={keychainCredentials} emptyState={null} actions={actions} />,
};
/** Long names, ids and paths wrap inside their columns. */
export const LongValues: Story = {
  render: () => {
    const long = "district-health-information-system-production-instance-for-the-national-ministry-of-health";
    return (
      <div className="space-y-8">
        <CredentialsTable
          rows={credentials.map((c) => ({ ...c, name: `${c.name} ${long}`, externalId: `ext-${long}` }))}
          showOwner
          emptyState={null}
          actions={actions}
        />
        <OauthClientsTable
          rows={oauthClients.map((c) => ({ ...c, name: `${c.name} ${long}`, authorizationEndpoint: `https://auth.example.org/${long}/oauth2/authorize` }))}
          showOwner
          emptyState={null}
          actions={actions}
        />
        <KeychainCredentialsTable
          rows={keychainCredentials.map((k) => ({ ...k, name: `${k.name} ${long}`, path: `$.data.${long}.credential_id` }))}
          emptyState={null}
          actions={actions}
        />
      </div>
    );
  },
};
export const OauthClientsEmpty: Story = {
  render: () => (
    <OauthClientsTable
      rows={[]}
      emptyState={<EmptyState message="No OAuth clients found." buttonText="Create a new OAuth client" onClick={() => {}} />}
    />
  ),
};
export const KeychainEmpty: Story = {
  render: () => (
    <KeychainCredentialsTable
      rows={[]}
      emptyState={<EmptyState message="No keychain credentials found." buttonText="Create a new keychain credential" onClick={() => {}} />}
    />
  ),
};
