import type { Meta, StoryObj } from "@storybook/react";
import ChannelFormModal from "./ChannelFormModal";
import { channelRowsFor, projectCredentialOptions, webhookAuthMethodOptions } from "@/mock-data/channels";
import { projects } from "@/mock-data/projects";
import { withRouter } from "@/stories/decorators";
import { RequestError } from "@/utils/errors";

const project = projects[0]!;
const existing = channelRowsFor(project.id)[0]!;

const meta: Meta<typeof ChannelFormModal> = {
  title: "Projects/Channels/ChannelFormModal",
  component: ChannelFormModal,
  decorators: [withRouter],
  args: {
    credentialOptions: projectCredentialOptions,
    authMethodOptions: webhookAuthMethodOptions,
    credentialsSettingsHref: `/projects/${project.id}/settings#credentials`,
    webhookSecuritySettingsHref: `/projects/${project.id}/settings#webhook_security`,
    onCancel: () => {},
    onSave: () => Promise.resolve(),
  },
};
export default meta;
type Story = StoryObj<typeof ChannelFormModal>;

/** No client credential ticked yet, so the hint says anyone with the URL can use it. */
export const New: Story = {};
export const Edit: Story = { args: { channel: existing } };
export const LongName: Story = {
  args: { channel: { ...existing, name: "Forward lab results from the district laboratory information system to the national registry" } },
};
/** A project with no webhook auth methods yet. */
export const NoAuthMethods: Story = { args: { authMethodOptions: [] } };
/** The options are still loading: the modal says so in place of the form, and Create channel is off. */
export const LoadingOptions: Story = { args: { status: { state: "loading" } } };
export const OptionsFailed: Story = { args: { status: { state: "error", message: "Couldn't reach Lightning." } } };

const submit: NonNullable<Story["play"]> = async ({ canvasElement }) => {
  canvasElement.ownerDocument.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
};
/** Save is still out: the button shows pending. */
export const Saving: Story = { args: { ...Edit.args, onSave: () => new Promise(() => {}) }, play: submit };
/** The server refuses the fields: the messages show on Name and Destination URL. */
export const FieldErrors: Story = {
  args: {
    ...Edit.args,
    onSave: () =>
      Promise.reject(
        new RequestError("The request body is not valid.", {
          fieldErrors: { name: ["A channel with this name already exists in this project"], destination_url: ["must be either a http or https URL"] },
        }),
      ),
  },
  play: submit,
};
/** Any other refusal keeps the form open with the server's message. */
export const SaveFails: Story = {
  args: { ...Edit.args, onSave: () => Promise.reject(new Error("Someone else changed this channel since you loaded it. Load it again and retry.")) },
  play: submit,
};
