import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import ProjectsPicker from "./ProjectsPicker";
import { projects } from "../../mock-data/projects";

const meta: Meta<typeof ProjectsPicker> = { title: "Credentials/ProjectsPicker", component: ProjectsPicker };
export default meta;
type Story = StoryObj<typeof ProjectsPicker>;

function Stateful({ initial, type, granted }: { initial: string[]; type: "credential" | "oauth_client"; granted?: ComponentProps<typeof ProjectsPicker>["granted"] }) {
  const [ids, setIds] = useState(initial);
  return <ProjectsPicker id="new" type={type} projects={projects} granted={granted} selectedIds={ids} onChange={setIds} />;
}

export const Empty: Story = { render: () => <Stateful initial={[]} type="credential" /> };
export const WithProjects: Story = {
  render: () => <Stateful initial={[projects[0]!.id, projects[1]!.id]} type="credential" />,
};
export const OauthClient: Story = { render: () => <Stateful initial={[]} type="oauth_client" /> };

const granted = [{ id: projects[0]!.id, name: projects[0]!.name, workflowsUsing: ["Patient intake", "Nightly DHIS2 sync"] }];

/** Removing a project whose workflows use the credential asks first. */
export const InUseByWorkflows: Story = {
  render: () => <Stateful initial={[projects[0]!.id]} type="credential" granted={granted} />,
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>(`button[aria-label="Remove ${projects[0]!.name}"]`)?.click();
  },
};
export const WithErrors: Story = {
  render: () => (
    <ProjectsPicker id="new" type="credential" projects={projects} selectedIds={[]} errors={["can't be blank"]} onChange={() => {}} />
  ),
};
