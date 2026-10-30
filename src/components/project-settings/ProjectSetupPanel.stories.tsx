import type { Meta, StoryObj } from "@storybook/react";
import ProjectSetupPanel from "./ProjectSetupPanel";
import { projectSettingsPropsFor, settingsFixtureFor } from "../../mock-data/project-settings";
import { projects } from "../../mock-data/projects";
import { session } from "../../mock-data/users";
import { withRouter, withGrayPanel } from "../../stories/decorators";

const project = projectSettingsPropsFor(settingsFixtureFor(projects[0]!), session.user);
const sandbox = projectSettingsPropsFor(settingsFixtureFor(projects[2]!), session.user);

const meta: Meta<typeof ProjectSetupPanel> = {
  title: "Project settings/ProjectSetupPanel",
  component: ProjectSetupPanel,
  decorators: [withRouter, withGrayPanel],
  args: {
    setup: { ...project.setup, canEditProject: true, canDeleteProject: true },
    parent: null,
    onSaveIdentity: async () => {},
    onSaveConcurrency: async () => {},
  },
};
export default meta;
type Story = StoryObj<typeof ProjectSetupPanel>;

export const Owner: Story = {};
export const ReadOnly: Story = { args: { setup: { ...project.setup, canEditProject: false, canDeleteProject: false } } };
export const Sandbox: Story = { args: { setup: { ...sandbox.setup, canEditProject: true, canDeleteProject: true }, parent: sandbox.parent } };
/** A failed save: the form keeps its changes and shows the message above Save. */
/** The hosted plan doesn't allow it: the switch is disabled and says why. */
export const PlanLimited: Story = { args: { setup: { ...project.setup, concurrencyLimitMessage: "Not allowed on Free plans" } } };
export const SaveFailed: Story = {
  args: { onSaveConcurrency: () => Promise.reject(new Error("The server could not complete that request.")) },
  play: async ({ canvasElement }) => {
    canvasElement.querySelector<HTMLButtonElement>("#project-concurrency-switch")?.click();
    await new Promise((r) => setTimeout(r));
    canvasElement.querySelector<HTMLButtonElement>("#project-concurrency-submit-btn")?.click();
  },
};
