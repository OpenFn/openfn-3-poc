import type { Meta, StoryObj } from "@storybook/react";
import CredentialsIndexPage from "./CredentialsIndexPage";
import { credentialIndexDataFor, credentialsFixture, fieldsForSchema } from "@/mock-data/credentials";
import { session } from "@/mock-data/users";
import { withCanvas } from "@/stories/decorators";
import { withUserSettingsAt } from "@/stories/withUserSettings";

const done = async () => {};
const { credentials, oauthClients, projects, credentialTypes } = credentialIndexDataFor(credentialsFixture(), undefined, session.user);

const meta: Meta<typeof CredentialsIndexPage> = {
  title: "Pages/Profile/CredentialsIndexPage",
  component: CredentialsIndexPage,
  // In its settings layout, which fills its parent, so give it a screen to fill.
  decorators: [withUserSettingsAt("/credentials"), withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    credentials,
    oauthClients,
    projects,
    credentialTypes,
    canCreateGlobalOauthClient: false,
    onCreateCredential: done,
    onUpdateCredential: done,
    onLoadCredentialSchema: async (key: string) => ({ fields: fieldsForSchema(key) }),
    onDeleteCredential: done,
    onCancelCredentialDeletion: done,
    onTransferCredential: done,
    onRevokeCredentialTransfer: done,
    onCreateOauthClient: done,
    onUpdateOauthClient: done,
    onDeleteOauthClient: done,
  },
};
export default meta;
type Story = StoryObj<typeof CredentialsIndexPage>;

export const Default: Story = {};
export const Empty: Story = { args: { credentials: [], oauthClients: [] } };
export const Long: Story = {
  args: {
    credentials: credentials.map((c) => ({
      ...c,
      name: `${c.name} for the national health information exchange production environment`,
      externalId: c.externalId && `${c.externalId}-with-a-very-long-suffix-that-keeps-going`,
      projects: c.projects.map((p) => ({ ...p, name: `${p.name}-with-a-long-project-name` })),
    })),
    oauthClients: oauthClients.map((c) => ({ ...c, name: `${c.name} registered for every district office`, authorizationEndpoint: `${c.authorizationEndpoint}?prompt=consent&access_type=offline` })),
  },
};
export const Loading: Story = { args: { credentials: [], oauthClients: [], status: { state: "loading" }, oauthClientsStatus: { state: "loading" } } };
export const Failed: Story = {
  args: { credentials: [], oauthClients: [], status: { state: "error", message: "Authentication is required." }, oauthClientsStatus: { state: "error", message: "Authentication is required." } },
};
