import type { Meta, StoryObj } from "@storybook/react";
import HistoryExportsPanel from "./HistoryExportsPanel";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter, withGrayPanel } from "../../stories/decorators";

const { historyExports } = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);

const meta: Meta<typeof HistoryExportsPanel> = {
  title: "Project settings/HistoryExportsPanel",
  component: HistoryExportsPanel,
  decorators: [withRouter, withGrayPanel],
  args: { exports: historyExports, sandbox: false },
};
export default meta;
type Story = StoryObj<typeof HistoryExportsPanel>;

export const WithExports: Story = {};
export const Empty: Story = { args: { exports: [] } };
