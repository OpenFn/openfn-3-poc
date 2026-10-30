import type { Meta, StoryObj } from "@storybook/react";
import AdminProjectsPage from "./AdminProjectsPage";
import { adminProjectRows } from "../../mock-data/admin";
import { purgeDeletedAfterDays } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { users } from "../../mock-data/users";
import { withCanvas, withRouter } from "../../stories/decorators";

const done = async () => {};
const rows = adminProjectRows();
const formUsers = users.map(({ id, firstName, lastName, email }) => ({ id, firstName, lastName, email }));
const project = projects[0]!;

const meta: Meta<typeof AdminProjectsPage> = {
  title: "Pages/Admin/AdminProjectsPage",
  component: AdminProjectsPage,
  // PageContent fills its parent, so give it a screen to fill.
  decorators: [withRouter, withCanvas("h-screen")],
  parameters: { layout: "fullscreen" },
  args: {
    projects: rows,
    form: null,
    deleteProject: null,
    gracePeriodDays: purgeDeletedAfterDays,
    onSave: done,
    onDelete: done,
    onCancelDeletion: done,
    onClose: () => {},
    newProjectHref: "/settings/projects/new",
    cancelHref: "/settings/projects",
  },
};
export default meta;
type Story = StoryObj<typeof AdminProjectsPage>;

export const List: Story = {};
export const NewProject: Story = { args: { form: { project: null, users: formUsers } } };
export const EditProject: Story = {
  args: {
    form: {
      project: { id: project.id, name: project.name, members: project.members.map(({ userId, role }) => ({ userId, role })) },
      users: formUsers,
    },
  },
};
export const DeleteDialog: Story = { args: { deleteProject: { id: rows[0]!.id, name: rows[0]!.name } } };
