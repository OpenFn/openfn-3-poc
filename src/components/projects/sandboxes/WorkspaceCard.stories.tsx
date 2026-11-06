import type { Meta, StoryObj } from "@storybook/react";
import { storyWorkspace } from "@/mock-data/sandboxes";
import { withRouter } from "@/stories/decorators";
import SandboxActions from "./SandboxActions";
import WorkspaceCard from "./WorkspaceCard";

const root = storyWorkspace[0]!;
const sandbox = storyWorkspace[1]!;
const scheduled = storyWorkspace[2]!;

const meta: Meta<typeof WorkspaceCard> = {
  title: "Projects/Sandboxes/WorkspaceCard",
  component: WorkspaceCard,
  decorators: [withRouter],
  args: { sandbox: root, isMain: true, selected: true },
};
export default meta;
type Story = StoryObj<typeof WorkspaceCard>;

/** The project at the top, which you're in. */
export const Main: Story = {};
/** With its menu, as the list gives a live sandbox. */
export const WithActions: Story = {
  args: { sandbox, isMain: false, selected: false, href: `/projects/${sandbox.id}/w`, actions: <SandboxActions sandbox={sandbox} editHref="#" onMerge={() => {}} onDelete={() => {}} /> },
};
export const Sandbox: Story = { args: { sandbox, isMain: false, selected: false, href: `/projects/${sandbox.id}/w` } };
export const NoDescription: Story = { args: { sandbox: { ...sandbox, description: null }, isMain: false, selected: false } };
export const ScheduledForDeletion: Story = { args: { sandbox: scheduled, isMain: false, selected: false } };
export const Long: Story = {
  args: {
    sandbox: {
      ...sandbox,
      name: "fhir-mapping-for-the-national-patient-registry-integration-v2",
      description: "Trying the FHIR R4 mappings for the national patient registry, district by district, before any of them go live.",
      parentName: "openhie-project-for-the-national-health-information-exchange",
    },
    isMain: false,
  },
};
