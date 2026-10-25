import type { Meta, StoryObj } from "@storybook/react";
import HistoryExportsTable from "./HistoryExportsTable";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";

const { historyExports } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);

const meta: Meta<typeof HistoryExportsTable> = {
  title: "Project settings/HistoryExportsTable",
  component: HistoryExportsTable,
  args: { exports: historyExports },
};
export default meta;
type Story = StoryObj<typeof HistoryExportsTable>;

export const WithExports: Story = {};
export const Empty: Story = { args: { exports: [] } };
