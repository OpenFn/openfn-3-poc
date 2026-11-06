import type { Meta, StoryObj } from "@storybook/react";
import OwnedCredentialsTable from "./OwnedCredentialsTable";
import { credentialIndexDataFor, credentialsFixture } from "@/mock-data/credentials";
import { session } from "@/mock-data/users";

const { credentials } = credentialIndexDataFor(credentialsFixture(), undefined, session.user);

const meta: Meta<typeof OwnedCredentialsTable> = {
  title: "Credentials/OwnedCredentialsTable",
  component: OwnedCredentialsTable,
  args: { credentials, isPending: () => false, onEdit: () => {}, onTransfer: () => {}, onCancelDeletion: () => {}, onDelete: () => {} },
};
export default meta;
type Story = StoryObj<typeof OwnedCredentialsTable>;

export const Default: Story = {};
/** A row waiting on the server: its menu spins. */
export const RowPending: Story = { args: { isPending: (id) => id === credentials[0]!.id } };
export const Long: Story = {
  args: {
    credentials: credentials.map((c) => ({
      ...c,
      name: `${c.name} for the national health information exchange production environment`,
      externalId: c.externalId && `${c.externalId}-with-a-very-long-suffix-that-keeps-going`,
    })),
  },
};
