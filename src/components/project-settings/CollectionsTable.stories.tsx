import type { Meta, StoryObj } from "@storybook/react";
import CollectionsTable from "./CollectionsTable";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { collections } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user).collections;
const noop = () => {};

const meta: Meta<typeof CollectionsTable> = {
  title: "Project settings/CollectionsTable",
  component: CollectionsTable,
  args: {
    collections,
    canManage: true,
    onCreate: noop,
    onPreview: noop,
    onEdit: noop,
    onDelete: noop,
  },
};
export default meta;
type Story = StoryObj<typeof CollectionsTable>;

export const Default: Story = {};
export const Empty: Story = { args: { collections: [] } };
export const ReadOnly: Story = { args: { canManage: false } };
/** A preview is loading: its button spins and the other previews wait. */
export const Previewing: Story = { args: { previewingId: collections[0]?.id ?? null } };
export const LongName: Story = {
  args: {
    collections: [
      { ...collections[0]!, name: "patient-registrations-from-the-district-health-information-system-nightly-export-2026" },
      ...collections.slice(1),
    ],
  },
};
