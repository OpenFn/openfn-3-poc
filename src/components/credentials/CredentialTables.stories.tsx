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
