import type { Meta, StoryObj } from "@storybook/react";
import OwnedOauthClientsTable from "./OwnedOauthClientsTable";
import { credentialIndexDataFor, credentialsFixture } from "@/mock-data/credentials";
import { session } from "@/mock-data/users";

const { oauthClients } = credentialIndexDataFor(credentialsFixture(), undefined, session.user);

const meta: Meta<typeof OwnedOauthClientsTable> = {
  title: "Credentials/OwnedOauthClientsTable",
  component: OwnedOauthClientsTable,
  args: { clients: oauthClients, onEdit: () => {}, onDelete: () => {} },
};
export default meta;
type Story = StoryObj<typeof OwnedOauthClientsTable>;

export const Default: Story = {};
export const Long: Story = {
  args: {
    clients: oauthClients.map((c) => ({ ...c, name: `${c.name} registered for every district office`, authorizationEndpoint: `${c.authorizationEndpoint}?prompt=consent&access_type=offline` })),
  },
};
