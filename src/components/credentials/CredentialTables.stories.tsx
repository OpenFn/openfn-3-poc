import type { Meta, StoryObj } from "@storybook/react";
import { CredentialsTable, KeychainCredentialsTable, OauthClientsTable } from "./CredentialTables";
import { EmptyState } from "../Table";
import Button from "../Button";
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
  <Button theme="secondary">
    Actions <span className="hero-chevron-down ml-1 h-5 w-5" />
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
