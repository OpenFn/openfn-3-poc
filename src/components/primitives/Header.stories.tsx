import type { Meta, StoryObj } from "@storybook/react";
import Header from "./Header";
import Button from "./Button";
import ProjectBreadcrumbs from "@/components/shell/ProjectBreadcrumbs";
import { projectLabel } from "@/components/shell/projectPickerItems";
import { projects } from "@/mock-data/projects";
import { withRouter } from "@/stories/decorators";

const meta: Meta<typeof Header> = { title: "Primitives/Header", component: Header, decorators: [withRouter] };
export default meta;
type Story = StoryObj<typeof Header>;

export const Title: Story = { args: { title: "Projects" } };
export const WithAction: Story = {
  args: { title: "API tokens", children: <Button>Generate new token</Button> },
};
export const WithBreadcrumbs: Story = {
  args: { breadcrumbs: <ProjectBreadcrumbs project={projects[0]!} label={projectLabel(projects[0]!, projects)} current="History" /> },
};
export const TitleWithCount: Story = {
  args: { title: "Projects", count: 3, children: <Button>Create project</Button> },
};
export const WithBreadcrumbsAndTitle: Story = {
  args: {
    breadcrumbs: <ProjectBreadcrumbs project={projects[0]!} label={projectLabel(projects[0]!, projects)} current="Workflows" />,
    title: "Workflows",
    count: 3,
    children: <Button>Create new workflow</Button>,
  },
};
export const LongTitle: Story = {
  args: {
    breadcrumbs: <ProjectBreadcrumbs project={projects[0]!} label={projectLabel(projects[0]!, projects)} current="Settings" />,
    title: "Malawi Community Health Worker Referrals to National HMIS (DHIS2 Tracker) settings",
    children: <Button>Save</Button>,
  },
};
export const LoggedOut: Story = { args: { title: "Log in", size: "xl" } };
export const LongBreadcrumbs: Story = {
  args: {
    breadcrumbs: (
      <ProjectBreadcrumbs
        project={projects[0]!}
        label="Kenya MoH community health referrals to DHIS2 aggregate sync (sandbox)"
        current="Fetch overdue referrals and upsert them as DHIS2 tracker events"
      />
    ),
  },
};
/** A line under the title saying what the page is; the actions stay level with the title. */
export const WithDescription: Story = {
  args: {
    breadcrumbs: <ProjectBreadcrumbs project={projects[0]!} label={projectLabel(projects[0]!, projects)} current="Workflows" />,
    title: "Workflows",
    count: 3,
    description: "Workflows move data between your connected systems.",
    children: <Button>Create new workflow</Button>,
  },
};
/** Without breadcrumbs the description sits under the title in the bar. */
export const TitleWithDescription: Story = {
  args: { title: "Projects", description: "Everything you're a member of.", children: <Button>Create project</Button> },
};
export const LongDescriptionWithAction: Story = {
  args: {
    breadcrumbs: <ProjectBreadcrumbs project={projects[0]!} label={projectLabel(projects[0]!, projects)} current="Workflows" />,
    title: "Workflows",
    description:
      "Workflows move data between your connected systems: each one starts from a webhook, a schedule or a Kafka topic and runs its steps in order, passing the state along.",
    children: <Button>Create new workflow</Button>,
  },
};
