import type { Meta, StoryObj } from "@storybook/react";
import ProjectsTable from "./ProjectsTable";
import { projectsOverviewFor } from "../../mock-data/dashboard-stats";
import { session } from "../../mock-data/users";
import { withRouter } from "../../stories/decorators";

const meta: Meta<typeof ProjectsTable> = {
  title: "Projects/ProjectsTable",
  component: ProjectsTable,
  decorators: [withRouter],
  args: {
    projects: projectsOverviewFor(session.user.id),
  },
};
export default meta;
type Story = StoryObj<typeof ProjectsTable>;

export const Default: Story = {};
export const Empty: Story = { args: { projects: [] } };
